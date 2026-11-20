import logging
import asyncio
from typing import List, Optional
import numpy as np

from app.core.config import get_settings

logger = logging.getLogger("automate.embeddings")
settings = get_settings()

# Module-level singleton for fastembed model
_FASTEMBED_MODEL = None


def get_fastembed_model():
    """Lazy loader for fastembed TextEmbedding model (cached singleton)."""
    global _FASTEMBED_MODEL
    if _FASTEMBED_MODEL is None:
        try:
            from fastembed import TextEmbedding
            logger.info(f"[EmbeddingService] Initializing fastembed ONNX model: {settings.EMBEDDING_MODEL}")
            _FASTEMBED_MODEL = TextEmbedding(model_name=settings.EMBEDDING_MODEL)
            logger.info("[EmbeddingService] Fastembed ONNX model ready (384-dim).")
        except Exception as e:
            logger.warning(f"[EmbeddingService] Failed to load fastembed: {e}")
            _FASTEMBED_MODEL = False
    return _FASTEMBED_MODEL if _FASTEMBED_MODEL is not False else None


class EmbeddingService:
    """
    Cloud-native embedding service generating 384-dimensional dense vectors
    using sentence-transformers/all-MiniLM-L6-v2 via FastEmbed (ONNX).
    Self-contained, fast, and does NOT require external daemons or GPUs.
    Maintains exact vector compatibility with pgvector (vector(384)).
    """

    @classmethod
    async def generate_embedding(cls, text: str) -> List[float]:
        """
        Generates a 384-dimensional vector embedding for a single text chunk.
        """
        if not text or not text.strip():
            return [0.0] * settings.EMBEDDING_DIMENSION

        # 1. Primary: Cloud-compatible fastembed (ONNX in-process)
        model = get_fastembed_model()
        if model:
            try:
                # model.embed returns a generator of numpy arrays
                emb_generator = model.embed([text.strip()])
                emb = next(emb_generator)
                # Convert numpy array to standard python float list
                vec = [float(x) for x in emb]
                if len(vec) == settings.EMBEDDING_DIMENSION:
                    return vec
                logger.warning(f"[EmbeddingService] Dimension mismatch from fastembed: {len(vec)}")
            except Exception as e:
                logger.warning(f"[EmbeddingService] fastembed inference error: {e}, attempting Ollama fallback.")

        # 2. Fallback: Local Ollama all-minilm (if running in local dev)
        try:
            import httpx
            payload = {
                "model": settings.OLLAMA_EMBED_MODEL,
                "prompt": text.strip(),
            }
            timeout = httpx.Timeout(5.0, connect=2.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/embeddings",
                    json=payload,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    embedding = data.get("embedding", [])
                    if len(embedding) == settings.EMBEDDING_DIMENSION:
                        return embedding
        except Exception:
            pass

        logger.error("[EmbeddingService] All embedding providers failed. Returning zero vector.")
        return [0.0] * settings.EMBEDDING_DIMENSION

    @classmethod
    async def generate_batch_embeddings(
        cls, texts: List[str], max_concurrency: int = 8
    ) -> List[List[float]]:
        """
        Generates embeddings for multiple text passages.
        Uses fastembed batching for extreme speed (<50ms for entire documents).
        """
        if not texts:
            return []

        clean_texts = [t.strip() if t else "" for t in texts]

        # 1. FastEmbed batch processing
        model = get_fastembed_model()
        if model:
            try:
                emb_generator = model.embed(clean_texts)
                results = []
                for emb in emb_generator:
                    results.append([float(x) for x in emb])
                if len(results) == len(texts):
                    return results
            except Exception as e:
                logger.warning(f"[EmbeddingService] Fastembed batch failed: {e}. Falling back to sequential.")

        # 2. Fallback sequential/concurrent
        tasks = [cls.generate_embedding(t) for t in clean_texts]
        return await asyncio.gather(*tasks)

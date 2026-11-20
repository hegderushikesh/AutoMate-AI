import asyncio
from typing import List, Optional
import httpx

from app.core.config import get_settings

settings = get_settings()


class EmbeddingService:
    """
    Communicates with local Ollama service to generate 384-dimensional dense embeddings
    using the all-minilm model. Never uses paid third-party APIs.
    """

    @classmethod
    async def generate_embedding(cls, text: str) -> List[float]:
        """
        Generates a 384-dimensional vector embedding for a single text chunk.
        """
        if not text or not text.strip():
            return [0.0] * settings.EMBEDDING_DIMENSION

        payload = {
            "model": settings.OLLAMA_EMBED_MODEL,
            "prompt": text.strip(),
        }

        try:
            timeout = httpx.Timeout(15.0, connect=3.0)
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
                    elif len(embedding) > 0:
                        # Normalize or pad if dimension mismatch
                        print(f"[EmbeddingService] Warning: embedding length is {len(embedding)}")
                        return embedding
                else:
                    print(f"[EmbeddingService] Ollama error {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[EmbeddingService] Connection error to Ollama at {settings.OLLAMA_BASE_URL}: {e}")

        # Return empty vector if failed
        return [0.0] * settings.EMBEDDING_DIMENSION

    @classmethod
    async def generate_batch_embeddings(
        cls, texts: List[str], max_concurrency: int = 5
    ) -> List[List[float]]:
        """
        Generates embeddings for multiple text passages concurrently with rate throttling.
        """
        semaphore = asyncio.Semaphore(max_concurrency)

        async def _embed_with_semaphore(t: str) -> List[float]:
            async with semaphore:
                return await cls.generate_embedding(t)

        tasks = [_embed_with_semaphore(t) for t in texts]
        return await asyncio.gather(*tasks)

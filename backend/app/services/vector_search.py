from typing import List, Dict, Any, Optional
from app.services.embedding_service import EmbeddingService
from app.core.database import DatabaseRepository


class VectorSearchService:
    """
    Orchestrates semantic similarity search across OEM PDF brochure chunks.
    Ensures identical embedding models are used for ingestion and query retrieval.
    """

    @classmethod
    async def search_relevant_chunks(
        cls,
        query: str,
        vehicle_id: Optional[str] = None,
        top_k: int = 5,
        match_threshold: float = 0.20,
    ) -> List[Dict[str, Any]]:
        """
        Embeds the incoming question and executes vector similarity search
        via Supabase pgvector RPC match_document_chunks or local cosine distance.
        """
        if not query or not query.strip():
            return []

        # 1. Embed search query using all-minilm (384d)
        query_embedding = await EmbeddingService.generate_embedding(query)

        # Verify embedding validity
        if not any(query_embedding):
            print("[VectorSearchService] Warning: Query embedding is all zeros.")
            return []

        # 2. Query pgvector store
        results = await DatabaseRepository.vector_search(
            query_embedding=query_embedding,
            match_threshold=match_threshold,
            match_count=top_k,
            filter_vehicle_id=vehicle_id,
        )

        return results

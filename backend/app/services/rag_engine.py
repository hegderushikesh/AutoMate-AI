import logging
import re
import time
from typing import List, Dict, Any, Optional, Tuple

from app.core.config import get_settings
from app.services.vector_search import VectorSearchService
from app.services.embedding_service import EmbeddingService
from app.services.comparison_service import format_inr
from app.services.llm_service import LLMService, LLMTimeoutError, LLMConnectionError, LLMServiceError
from app.core.database import DatabaseRepository
from app.models.schemas import CitationItem

logger = logging.getLogger("automate.rag")
settings = get_settings()

GREETING_PATTERN = re.compile(
    r"^(hi|hello|hey|greetings|good morning|good afternoon|good evening|thanks|thank you|who are you|what can you do|help)[\s!.,?]*$",
    re.IGNORECASE,
)


class RAGEngine:
    """
    Production RAG engine for Automotive Intelligence.
    Enforces intent classification, strict context grounding, exact page-level citations,
    and truthful refusals when information is absent.
    """

    GREETING_RESPONSE = (
        "Hello! I am AutoMate AI, your specialized automotive intelligence assistant. "
        "I can help you explore technical vehicle specifications, compare variants and trims, "
        "and answer detailed questions grounded strictly in official OEM brochures. "
        "How can I assist your vehicle research today?"
    )

    NOT_FOUND_RESPONSE = "Not found in the brochure."

    @staticmethod
    def is_greeting(query: str) -> bool:
        q = query.strip()
        if GREETING_PATTERN.match(q):
            return True
        low = q.lower()
        return low in [
            "hi", "hello", "hey", "hola", "namaste", "thanks", "thank you",
            "who are you", "what can you do", "help"
        ]

    @classmethod
    async def generate_rag_response(
        cls,
        user_query: str,
        vehicle_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> Tuple[str, List[CitationItem], Dict[str, Any]]:
        """
        Executes the full RAG pipeline with diagnostics:
        1. Classifies intent (Greeting vs Technical Inquiry).
        2. Retrieves relevant brochure chunks via pgvector.
        3. Retrieves structured vehicle and variant specifications.
        4. Builds grounded context prompt (max ~1500 tokens).
        5. Calls local Ollama OpenAI-compatible endpoint.
        6. Extracts verified citations.
        Returns:
            Tuple[answer_text, sources_list, diagnostics_dict]
        """
        t_start = time.perf_counter()
        diagnostics: Dict[str, Any] = {
            "query": user_query,
            "session_id": session_id,
            "vehicle_id": vehicle_id,
        }

        # 1. Intent Classification
        if cls.is_greeting(user_query):
            total_time_ms = (time.perf_counter() - t_start) * 1000
            diagnostics.update({
                "intent": "greeting",
                "embedding_len": 0,
                "chunks_retrieved": 0,
                "top_similarity": 0.0,
                "prompt_size": 0,
                "raw_response": cls.GREETING_RESPONSE[:100],
                "cleaned_answer": cls.GREETING_RESPONSE[:100],
                "latencies": {"intent_ms": total_time_ms, "total_ms": total_time_ms},
            })
            return cls.GREETING_RESPONSE, [], diagnostics

        diagnostics["intent"] = "technical_brochure_query"

        # 2. Embedding Generation & Latency Tracking
        t_embed_start = time.perf_counter()
        query_embedding = await EmbeddingService.generate_embedding(user_query)
        embed_time_ms = (time.perf_counter() - t_embed_start) * 1000
        diagnostics["embedding_len"] = len(query_embedding)
        diagnostics["latencies"] = {"embedding_ms": round(embed_time_ms, 2)}

        # 3. Vector Similarity Search
        t_search_start = time.perf_counter()
        relevant_chunks = await DatabaseRepository.vector_search(
            query_embedding=query_embedding,
            match_threshold=0.20,
            match_count=5,
            filter_vehicle_id=vehicle_id,
        )
        search_time_ms = (time.perf_counter() - t_search_start) * 1000
        diagnostics["latencies"]["vector_search_ms"] = round(search_time_ms, 2)
        diagnostics["chunks_retrieved"] = len(relevant_chunks)

        top_similarity = relevant_chunks[0].get("similarity", 0.0) if relevant_chunks else 0.0
        diagnostics["top_similarity"] = round(top_similarity, 4)

        # 4. Fallback if no relevant chunks found
        if not relevant_chunks:
            total_time_ms = (time.perf_counter() - t_start) * 1000
            diagnostics["latencies"]["total_ms"] = round(total_time_ms, 2)
            diagnostics["prompt_size"] = 0
            diagnostics["raw_response"] = cls.NOT_FOUND_RESPONSE
            diagnostics["cleaned_answer"] = cls.NOT_FOUND_RESPONSE
            return cls.NOT_FOUND_RESPONSE, [], diagnostics

        # 5. Build structured vehicle specifications
        vehicle_context_text = ""
        if vehicle_id:
            vehicle = await DatabaseRepository.get_vehicle_by_id(vehicle_id)
            if vehicle:
                vehicle_context_text = cls._format_vehicle_specs(vehicle)

        # 6. Build context from top 5 brochure chunks (capped ~1500 tokens / 4000 chars)
        brochure_blocks = []
        sources: List[CitationItem] = []
        seen_citations = set()
        total_context_chars = len(vehicle_context_text)

        for chunk in relevant_chunks[:5]:
            doc_name = chunk.get("filename") or "Official OEM Brochure"
            page_num = chunk.get("page_number", 1)
            content = chunk.get("content", "").strip()

            # Cap individual chunk length if needed to keep total context compact
            if total_context_chars + len(content) > 4000:
                content = content[: max(200, 4000 - total_context_chars)]

            citation_key = f"{doc_name}#P{page_num}"
            if citation_key not in seen_citations:
                seen_citations.add(citation_key)
                sources.append(
                    CitationItem(
                        document_name=doc_name,
                        page_number=page_num,
                        chunk_id=chunk.get("id"),
                        excerpt=content[:200] + "..." if len(content) > 200 else content,
                    )
                )

            block = f"--- [Doc: {doc_name}, Page: {page_num}] ---\n{content}"
            brochure_blocks.append(block)
            total_context_chars += len(block)
            if total_context_chars >= 4000:
                break

        brochure_context_text = "\n\n".join(brochure_blocks)

        context_prompt = (
            "CONTEXT INFORMATION:\n"
            "==================================================\n"
            f"A. STRUCTURED VEHICLE SPECIFICATIONS:\n"
            f"{vehicle_context_text if vehicle_context_text else 'No vehicle pre-selected.'}\n\n"
            f"B. RETRIEVED OEM BROCHURE PASSAGES:\n"
            f"{brochure_context_text}\n"
            "=================================================="
        )

        diagnostics["prompt_size"] = len(context_prompt)
        diagnostics["approx_tokens"] = len(context_prompt) // 4

        # 7. LLM Inference via OpenAI-compatible endpoint
        t_llm_start = time.perf_counter()
        answer, raw_preview = await LLMService.generate_chat_completion(
            context_prompt=context_prompt,
            user_query=user_query,
        )
        llm_time_ms = (time.perf_counter() - t_llm_start) * 1000
        diagnostics["latencies"]["llm_ms"] = round(llm_time_ms, 2)

        total_time_ms = (time.perf_counter() - t_start) * 1000
        diagnostics["latencies"]["total_ms"] = round(total_time_ms, 2)
        diagnostics["raw_response"] = raw_preview
        diagnostics["cleaned_answer"] = answer[:200]

        # Ensure answer is strictly non-empty
        if not answer or not answer.strip():
            answer = cls.NOT_FOUND_RESPONSE
            sources = []

        return answer, sources, diagnostics

    @classmethod
    def _format_vehicle_specs(cls, vehicle: Dict[str, Any]) -> str:
        """Serializes vehicle and trim specs into clean, structured prompt text."""
        lines = [
            f"Vehicle: {vehicle.get('make')} {vehicle.get('model')} ({vehicle.get('year')})",
            f"Category: {vehicle.get('category')} | Body Type: {vehicle.get('body_type')} | Price Range: {vehicle.get('price_range')}",
            f"Overview: {vehicle.get('overview')}",
            "Trim Variants & Engineering Specs:",
        ]

        variants = vehicle.get("variants", [])
        for var in variants:
            price_val = var.get("price")
            price_formatted = format_inr(price_val) if price_val else "N/A"
            lines.append(
                f"  - Trim: {var.get('trim_name')} | Price: {price_formatted} | Engine: {var.get('engine_type')} | "
                f"Horsepower: {var.get('horsepower_hp')} hp | Torque: {var.get('torque_nm')} Nm | "
                f"Transmission: {var.get('transmission')} | Drivetrain: {var.get('drivetrain')} | "
                f"Fuel/Economy: {var.get('fuel_economy')} | Seats: {var.get('seating_capacity')}"
            )
            features = var.get("key_features", [])
            if features:
                lines.append(f"    Key Features: {', '.join(features[:4])}")

        return "\n".join(lines)

import re
from typing import List, Dict, Any, Optional, Tuple
import httpx

from app.core.config import get_settings
from app.services.vector_search import VectorSearchService
from app.core.database import DatabaseRepository
from app.models.schemas import CitationItem

settings = get_settings()


class RAGEngine:
    """
    Production RAG engine for Automotive Intelligence.
    Enforces strict context grounding, exact page-level citations,
    and truthful refusals when information is absent.
    """

    SYSTEM_PROMPT = """You are AutoMate AI, an authoritative, precision-focused Automotive AI Assistant.
Your mission is to provide accurate, factual, and deeply technical answers regarding vehicle specifications, features, performance, charging, and engineering.

STRICT GROUNDING RULES:
1. You must answer ONLY using the verified context provided below (Structured Vehicle Specifications and Retrieved Brochure Passages).
2. For EVERY technical claim, specification, or fact you mention, you MUST append a citation referencing the source document and page number in this format: [Doc: <Filename>, Page: <PageNumber>].
3. If the answer cannot be determined with complete confidence from the provided context, state clearly and concisely: "This information is not available in the provided vehicle brochures or specifications."
4. NEVER invent, extrapolate, or hallucinate vehicle specifications, trim levels, battery sizes, acceleration times, or features.
5. Present numerical specifications with proper units (hp, Nm, kWh, kW, mm, MPGe, seconds).
6. Format your responses with clean markdown, bullet points, or comparison tables when appropriate."""

    @classmethod
    async def generate_rag_response(
        cls,
        user_query: str,
        vehicle_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> Tuple[str, List[CitationItem]]:
        """
        Executes the full RAG pipeline:
        1. Retrieves relevant brochure chunks via pgvector.
        2. Retrieves structured vehicle and variant specifications.
        3. Builds grounded context prompt.
        4. Calls local Ollama model (qwen3:1.7b).
        5. Extracts and verifies citations.
        """
        # 1. Retrieve matching chunks from vector search
        relevant_chunks = await VectorSearchService.search_relevant_chunks(
            query=user_query,
            vehicle_id=vehicle_id,
            top_k=4,
            match_threshold=0.20,
        )

        # 2. Retrieve structured vehicle specifications
        vehicle_context_text = ""
        if vehicle_id:
            vehicle = await DatabaseRepository.get_vehicle_by_id(vehicle_id)
            if vehicle:
                vehicle_context_text = cls._format_vehicle_specs(vehicle)
        else:
            # If no specific vehicle filter, provide list of available models
            all_vehicles = await DatabaseRepository.get_vehicles()
            vehicle_context_text = cls._format_vehicle_catalog_summary(all_vehicles)

        # 3. Build context from brochure passages
        brochure_context_text = ""
        citations_map: Dict[str, CitationItem] = {}

        if relevant_chunks:
            brochure_blocks = []
            for idx, chunk in enumerate(relevant_chunks):
                doc_name = chunk.get("filename") or "Official Brochure"
                page_num = chunk.get("page_number", 1)
                content = chunk.get("content", "").strip()

                citation_key = f"{doc_name}#P{page_num}"
                if citation_key not in citations_map:
                    citations_map[citation_key] = CitationItem(
                        document_name=doc_name,
                        page_number=page_num,
                        chunk_id=chunk.get("id"),
                        excerpt=content[:200] + "..." if len(content) > 200 else content,
                    )

                block = f"--- [Doc: {doc_name}, Page: {page_num}] ---\n{content}"
                brochure_blocks.append(block)

            brochure_context_text = "\n\n".join(brochure_blocks)
        else:
            brochure_context_text = "No relevant PDF brochure sections found for this query."

        # 4. Construct complete prompt for Ollama
        prompt = f"""CONTEXT INFORMATION:
==================================================
A. STRUCTURED VEHICLE SPECIFICATIONS:
{vehicle_context_text if vehicle_context_text else "No vehicle pre-selected."}

B. RETRIEVED OEM BROCHURE PASSAGES:
{brochure_context_text}
==================================================

USER QUESTION:
{user_query}

Provide a factual, grounded answer based strictly on the context above. Include citations [Doc: <name>, Page: <page>] for every brochure reference:"""

        # 5. Call Ollama generation endpoint
        answer = await cls._call_ollama(prompt)

        # 6. Extract cited references
        matched_citations = list(citations_map.values())

        return answer, matched_citations

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
            lines.append(
                f"  - Trim: {var.get('trim_name')} | Price: ${var.get('price'):,.2f} | Engine: {var.get('engine_type')} | "
                f"Horsepower: {var.get('horsepower_hp')} hp | Torque: {var.get('torque_nm')} Nm | "
                f"Transmission: {var.get('transmission')} | Drivetrain: {var.get('drivetrain')} | "
                f"Fuel/Economy: {var.get('fuel_economy')} | Seats: {var.get('seating_capacity')}"
            )
            features = var.get("key_features", [])
            if features:
                lines.append(f"    Key Features: {', '.join(features[:5])}")
            dimensions = var.get("dimensions", {})
            if dimensions:
                dim_str = ", ".join(f"{k}: {v}" for k, v in dimensions.items())
                lines.append(f"    Dimensions: {dim_str}")

        return "\n".join(lines)

    @classmethod
    def _format_vehicle_catalog_summary(cls, vehicles: List[Dict[str, Any]]) -> str:
        lines = ["Available Catalog Vehicles:"]
        for v in vehicles[:5]:
            lines.append(f"- {v.get('make')} {v.get('model')} ({v.get('year')}) - {v.get('category')} ({v.get('price_range')})")
        return "\n".join(lines)

    @classmethod
    async def _call_ollama(cls, prompt: str) -> str:
        """Communicates with local Ollama text generation API."""
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "system": cls.SYSTEM_PROMPT,
            "stream": False,
            "options": {
                "temperature": 0.1,  # Low temperature to suppress hallucination
                "top_p": 0.8,
            },
        }

        try:
            timeout = httpx.Timeout(120.0, connect=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json=payload,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    response_text = data.get("response", "").strip()
                    # If response contains think tags from Qwen, clean them if needed
                    response_text = re.sub(r'<think>.*?</think>', '', response_text, flags=re.DOTALL).strip()
                    return response_text
                else:
                    return f"Ollama generation returned error code {resp.status_code}: {resp.text}"
        except Exception as e:
            return f"Unable to reach local Ollama inference service: {str(e)}. Please ensure Ollama is running."

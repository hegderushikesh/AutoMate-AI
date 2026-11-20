import logging
import time
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatSessionResponse,
    CitationItem,
)
from app.core.database import DatabaseRepository
from app.services.rag_engine import RAGEngine
from app.services.llm_service import (
    LLMTimeoutError,
    LLMConnectionError,
    LLMServiceError,
)

logger = logging.getLogger("automate.chat")
router = APIRouter()


async def _handle_chat_query(payload: ChatMessageRequest) -> ChatMessageResponse:
    """
    Core RAG Chat pipeline with rigorous diagnostic logging and hardened error recovery.
    """
    t_start = time.perf_counter()

    # Validate input query
    try:
        user_query = payload.question
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "Validation Error", "message": str(e)},
        )

    session_id = payload.session_id

    # 1. Step 1: Request received
    logger.info(
        f"[CHAT_DIAGNOSTICS] [Step 1/6] Request received | session_id={session_id} | "
        f"vehicle_id={payload.vehicle_id} | query_len={len(user_query)} | query={repr(user_query[:80])}"
    )

    # Create session if not provided
    if not session_id:
        title = user_query[:45] + "..." if len(user_query) > 45 else user_query
        session = await DatabaseRepository.create_chat_session(
            title=title, vehicle_id=payload.vehicle_id
        )
        session_id = session["id"]

    # Save user message to database
    await DatabaseRepository.save_chat_message(
        session_id=session_id,
        role="user",
        content=user_query,
    )

    try:
        # 2. Step 2 to 6: Execute Grounded RAG with step-by-step diagnostics
        answer_text, sources, diag = await RAGEngine.generate_rag_response(
            user_query=user_query,
            vehicle_id=payload.vehicle_id,
            session_id=session_id,
        )

        # Log detailed diagnostics for each step
        latencies = diag.get("latencies", {})
        logger.info(f"[CHAT_DIAGNOSTICS] [Step 2/6] Intent evaluated | intent={diag.get('intent')}")
        logger.info(
            f"[CHAT_DIAGNOSTICS] [Step 3/6] Query embedding | dim={diag.get('embedding_len')} | "
            f"latency={latencies.get('embedding_ms', 0)}ms"
        )
        logger.info(
            f"[CHAT_DIAGNOSTICS] [Step 4/6] Chunks retrieved | count={diag.get('chunks_retrieved')} | "
            f"top_similarity={diag.get('top_similarity')} | latency={latencies.get('vector_search_ms', 0)}ms"
        )
        logger.info(
            f"[CHAT_DIAGNOSTICS] [Step 5/6] Prompt size | chars={diag.get('prompt_size')} | "
            f"approx_tokens={diag.get('approx_tokens', 0)}"
        )
        logger.info(
            f"[CHAT_DIAGNOSTICS] [Step 6/6] Inference complete | llm_latency={latencies.get('llm_ms', 0)}ms | "
            f"raw_response={repr(diag.get('raw_response', '')[:150])} | "
            f"cleaned_answer={repr(answer_text[:150])} | total_latency={latencies.get('total_ms', 0)}ms"
        )

        # Ensure answer is strictly non-empty
        if not answer_text or not answer_text.strip():
            answer_text = "Not found in the brochure."
            sources = []

        # Save assistant message to database ONLY AFTER a valid non-empty answer exists
        sources_data = [s.model_dump() for s in sources]
        await DatabaseRepository.save_chat_message(
            session_id=session_id,
            role="assistant",
            content=answer_text,
            citations=sources_data,
        )

        return ChatMessageResponse(
            answer=answer_text,
            sources=sources,
            session_id=session_id,
            content=answer_text,
            role="assistant",
            citations=sources,
        )

    except LLMTimeoutError as e:
        total_err_ms = (time.perf_counter() - t_start) * 1000
        logger.error(f"[CHAT_DIAGNOSTICS] [FAILED] LLM Timeout after {total_err_ms:.2f}ms: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={"error": "Gateway Timeout", "message": str(e)},
        )
    except LLMConnectionError as e:
        total_err_ms = (time.perf_counter() - t_start) * 1000
        logger.error(f"[CHAT_DIAGNOSTICS] [FAILED] LLM Connection Error after {total_err_ms:.2f}ms: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "Bad Gateway", "message": str(e)},
        )
    except LLMServiceError as e:
        total_err_ms = (time.perf_counter() - t_start) * 1000
        logger.error(f"[CHAT_DIAGNOSTICS] [FAILED] LLM Service Error after {total_err_ms:.2f}ms: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "Bad Gateway", "message": str(e)},
        )
    except HTTPException:
        raise
    except Exception as e:
        total_err_ms = (time.perf_counter() - t_start) * 1000
        logger.error(f"[CHAT_DIAGNOSTICS] [FAILED] Unexpected Chat Error after {total_err_ms:.2f}ms: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Server Error", "message": f"Chat processing failed: {str(e)}"},
        )


@router.post("", response_model=ChatMessageResponse)
async def post_chat(payload: ChatMessageRequest):
    """POST /api/chat endpoint."""
    return await _handle_chat_query(payload)


@router.post("/message", response_model=ChatMessageResponse)
async def post_chat_message(payload: ChatMessageRequest):
    """POST /api/chat/message (alias for backwards compatibility)."""
    return await _handle_chat_query(payload)


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_chat_sessions():
    """Retrieve all past conversation sessions."""
    sessions = await DatabaseRepository.get_chat_sessions()
    return sessions


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_new_session(title: Optional[str] = "New Automotive Chat", vehicle_id: Optional[str] = None):
    """Start a fresh chat session."""
    session = await DatabaseRepository.create_chat_session(title=title, vehicle_id=vehicle_id)
    return session


@router.get("/sessions/{session_id}/messages")
async def get_session_history(session_id: str):
    """Fetch multi-turn message history for a specific chat session."""
    messages = await DatabaseRepository.get_session_messages(session_id)
    return {
        "session_id": session_id,
        "message_count": len(messages),
        "messages": messages,
    }

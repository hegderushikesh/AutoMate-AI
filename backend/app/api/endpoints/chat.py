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

router = APIRouter()


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(payload: ChatMessageRequest):
    """
    RAG-grounded conversation endpoint.
    Retrieves vector brochure chunks and structured specifications,
    queries local Ollama, stores multi-turn conversation history, and provides citations.
    """
    session_id = payload.session_id

    # Create session if not provided
    if not session_id:
        title = payload.message[:45] + "..." if len(payload.message) > 45 else payload.message
        session = await DatabaseRepository.create_chat_session(title=title, vehicle_id=payload.vehicle_id)
        session_id = session["id"]

    # 1. Save user question
    await DatabaseRepository.save_chat_message(
        session_id=session_id,
        role="user",
        content=payload.message,
    )

    # 2. Execute Grounded RAG
    answer_text, citations = await RAGEngine.generate_rag_response(
        user_query=payload.message,
        vehicle_id=payload.vehicle_id,
        session_id=session_id,
    )

    # 3. Save assistant response with citations
    citations_data = [c.model_dump() for c in citations]
    await DatabaseRepository.save_chat_message(
        session_id=session_id,
        role="assistant",
        content=answer_text,
        citations=citations_data,
    )

    return ChatMessageResponse(
        session_id=session_id,
        role="assistant",
        content=answer_text,
        citations=citations,
    )


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

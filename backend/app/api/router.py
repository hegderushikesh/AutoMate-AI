from fastapi import APIRouter
from app.api.endpoints import health, vehicles, documents, chat, comparison

api_router = APIRouter()

# Health & diagnostic check
api_router.include_router(health.router, tags=["Health"])

# Vehicles & Variants
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])

# Document Management & Ingestion
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])

# RAG Chat & History
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])

# Comparison Studio (Vehicles & Variants)
api_router.include_router(comparison.router, prefix="/compare", tags=["Comparison"])

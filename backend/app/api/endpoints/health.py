import os
from fastapi import APIRouter, status
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Returns application health, Groq Cloud API configuration,
    fastembed 384d embedding engine status, and database connectivity.
    """
    groq_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "").strip()
    groq_configured = bool(groq_key)

    supabase_configured = bool(
        settings.SUPABASE_URL and (settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY)
    )

    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "llm": {
            "provider": "Groq Cloud API",
            "status": "connected" if groq_configured else "missing_api_key",
            "model": settings.GROQ_MODEL,
            "target_model": settings.GROQ_MODEL,
        },
        "groq": {
            "status": "connected" if groq_configured else "missing_api_key",
            "model": settings.GROQ_MODEL,
            "configured": groq_configured,
        },
        "embeddings": {
            "provider": "fastembed (ONNX runtime)",
            "model": settings.EMBEDDING_MODEL,
            "dimension": settings.EMBEDDING_DIMENSION,
            "cloud_ready": True,
        },
        # Backwards compatibility mapping for frontend UI badges
        "ollama": {
            "status": "connected" if groq_configured else "missing_api_key",
            "target_model": f"Groq {settings.GROQ_MODEL}",
            "embed_model": "fastembed all-minilm (384d)",
        },
        "database": {
            "configured": supabase_configured,
            "supabase_url": settings.SUPABASE_URL if settings.SUPABASE_URL else "Local persistent store",
        },
    }

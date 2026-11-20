import httpx
from fastapi import APIRouter, status
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Returns application health, Ollama status, and configuration details."""
    ollama_online = False
    available_models = []

    try:
        timeout = httpx.Timeout(2.0, connect=1.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                ollama_online = True
                models_data = resp.json().get("models", [])
                available_models = [m.get("name") for m in models_data]
    except Exception:
        ollama_online = False

    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "ollama": {
            "status": "connected" if ollama_online else "disconnected",
            "base_url": settings.OLLAMA_BASE_URL,
            "target_model": settings.OLLAMA_MODEL,
            "embed_model": settings.OLLAMA_EMBED_MODEL,
            "available_models": available_models,
        },
        "database": {
            "configured": bool(settings.SUPABASE_URL and (settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY)),
            "supabase_url": settings.SUPABASE_URL if settings.SUPABASE_URL else "Not configured",
        },
    }

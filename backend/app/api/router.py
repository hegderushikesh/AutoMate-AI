from fastapi import APIRouter
from app.api.endpoints import health

api_router = APIRouter()

# Health & diagnostic check
api_router.include_router(health.router, tags=["Health"])

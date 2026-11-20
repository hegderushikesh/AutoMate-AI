from fastapi import APIRouter
from app.api.endpoints import health, vehicles

api_router = APIRouter()

# Health & diagnostic check
api_router.include_router(health.router, tags=["Health"])

# Vehicles & Variants
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])

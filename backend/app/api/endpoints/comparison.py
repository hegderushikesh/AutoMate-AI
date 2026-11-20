from fastapi import APIRouter
from app.models.schemas import ComparisonRequest, ComparisonResult
from app.services.comparison_service import ComparisonService

router = APIRouter()


@router.post("/vehicles", response_model=ComparisonResult)
async def compare_vehicles_endpoint(payload: ComparisonRequest):
    """
    Compare multiple automobile models side-by-side.
    Returns normalized spec tables, winner highlights, and radar chart metrics.
    """
    result = await ComparisonService.compare_vehicles(payload.vehicle_ids or [])
    return result


@router.post("/variants", response_model=ComparisonResult)
async def compare_variants_endpoint(payload: ComparisonRequest):
    """
    Compare distinct trims/variants of an automobile.
    Evaluates horsepower, torque, transmission, pricing, features, and mechanical specs.
    """
    result = await ComparisonService.compare_variants(payload.variant_ids or [])
    return result

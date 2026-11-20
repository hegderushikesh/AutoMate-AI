from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.schemas import (
    VehicleResponse,
    VehicleDetailResponse,
    VehicleCreate,
    VariantResponse,
    VariantCreate,
)
from app.core.database import DatabaseRepository

router = APIRouter()


@router.get("", response_model=List[VehicleResponse])
async def list_vehicles(
    category: Optional[str] = Query(None, description="Filter by category: Electric, Gasoline, Hybrid, etc."),
    body_type: Optional[str] = Query(None, description="Filter by body type: Sedan, SUV, Truck, Coupe"),
    make: Optional[str] = Query(None, description="Filter by make: Porsche, BMW, Hyundai, Ford"),
):
    """List vehicles with optional category, body type, and make filters."""
    vehicles = await DatabaseRepository.get_vehicles()

    filtered = []
    for v in vehicles:
        if category and v.get("category", "").lower() != category.lower():
            continue
        if body_type and v.get("body_type", "").lower() != body_type.lower():
            continue
        if make and v.get("make", "").lower() != make.lower():
            continue

        variants = v.get("variants", [])
        v_copy = dict(v)
        v_copy["variant_count"] = len(variants)
        filtered.append(v_copy)

    return filtered


@router.get("/{vehicle_id}", response_model=VehicleDetailResponse)
async def get_vehicle_details(vehicle_id: str):
    """Retrieve complete vehicle specifications including all trims/variants."""
    vehicle = await DatabaseRepository.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{vehicle_id}' not found.",
        )
    return vehicle


@router.post("", response_model=VehicleDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(payload: VehicleCreate):
    """Create a new vehicle profile with optional initial variants."""
    created = await DatabaseRepository.create_vehicle(payload.model_dump())
    return created


@router.get("/{vehicle_id}/variants", response_model=List[VariantResponse])
async def list_vehicle_variants(vehicle_id: str):
    """List all trims/variants associated with a specific vehicle."""
    vehicle = await DatabaseRepository.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{vehicle_id}' not found.",
        )
    return vehicle.get("variants", [])


@router.post("/{vehicle_id}/variants", response_model=VariantResponse, status_code=status.HTTP_201_CREATED)
async def add_vehicle_variant(vehicle_id: str, payload: VariantCreate):
    """Add a new engineering specification variant to a vehicle."""
    vehicle = await DatabaseRepository.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{vehicle_id}' not found.",
        )

    variant = await DatabaseRepository.add_variant(vehicle_id, payload.model_dump())
    return variant

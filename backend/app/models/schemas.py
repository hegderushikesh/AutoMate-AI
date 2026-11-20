from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# --- Variant Models ---
class VariantBase(BaseModel):
    trim_name: str = Field(..., example="Taycan 4S AWD")
    price: float = Field(..., gt=0, example=118500.0)
    engine_type: str = Field(..., example="Dual Permanent Magnet Synchronous Motors")
    displacement_cc: Optional[int] = Field(None, example=None)
    horsepower_hp: int = Field(..., gt=0, example=536)
    torque_nm: int = Field(..., gt=0, example=695)
    transmission: str = Field(..., example="1-Speed Front / 2-Speed Rear Transmission")
    drivetrain: str = Field(..., example="AWD")
    fuel_type: str = Field(..., example="Electric")
    fuel_economy: str = Field(..., example="82 MPGe (EPA Combined)")
    seating_capacity: int = Field(5, ge=1, le=12, example=4)
    safety_rating_ncap: Optional[str] = Field("5-Star", example="5-Star")
    key_features: List[str] = Field(default_factory=list, example=["Adaptive Air Suspension", "Bose Audio"])
    dimensions: Dict[str, Any] = Field(default_factory=dict, example={"length_mm": 4963, "curb_weight_kg": 2180})


class VariantCreate(VariantBase):
    pass


class VariantResponse(VariantBase):
    id: str
    vehicle_id: str


# --- Vehicle Models ---
class VehicleBase(BaseModel):
    make: str = Field(..., example="Porsche")
    model: str = Field(..., example="Taycan")
    year: int = Field(..., ge=1900, le=2100, example=2025)
    body_type: str = Field(..., example="Sedan")
    category: str = Field(..., example="Electric")
    price_range: Optional[str] = Field(None, example="₹1.61 Cr - ₹2.53 Cr")
    hero_image_url: Optional[str] = Field(None, example="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e")
    overview: Optional[str] = Field(None, example="High performance electric luxury sports sedan.")


class VehicleCreate(VehicleBase):
    variants: Optional[List[VariantCreate]] = Field(default_factory=list)


class VehicleResponse(VehicleBase):
    id: str
    variant_count: Optional[int] = 0


class VehicleDetailResponse(VehicleBase):
    id: str
    variants: List[VariantResponse] = Field(default_factory=list)


# --- Document Models ---
class DocumentChunkInfo(BaseModel):
    page_number: int
    chunk_index: int
    content: str
    similarity: Optional[float] = None


class DocumentResponse(BaseModel):
    id: str
    vehicle_id: Optional[str]
    filename: str
    file_size_bytes: int
    total_pages: int
    status: str
    error_message: Optional[str] = None
    created_at: Optional[str] = None


# --- RAG & Chat Models ---
class CitationItem(BaseModel):
    document_name: str = Field(..., example="2025_Porsche_Taycan_Brochure.pdf")
    page_number: int = Field(..., example=4)
    chunk_id: Optional[str] = None
    excerpt: str = Field(..., example="Features an 800-volt high-speed DC charging architecture.")


class ChatMessageRequest(BaseModel):
    message: Optional[str] = Field(None, example="What is the 0-60 time and battery capacity of the Taycan Turbo S?")
    query: Optional[str] = Field(None, example="What is the 0-60 time?")
    session_id: Optional[str] = None
    vehicle_id: Optional[str] = None

    @property
    def question(self) -> str:
        q = (self.message or self.query or "").strip()
        if not q:
            raise ValueError("A non-empty 'message' or 'query' is required.")
        return q


class ChatMessageResponse(BaseModel):
    answer: str
    sources: List[CitationItem] = Field(default_factory=list)
    session_id: str
    content: Optional[str] = None
    role: str = "assistant"
    citations: List[CitationItem] = Field(default_factory=list)

    def model_post_init(self, __context: Any) -> None:
        if self.content is None:
            self.content = self.answer
        if not self.citations and self.sources:
            self.citations = self.sources


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    vehicle_id: Optional[str] = None
    created_at: Optional[str] = None


# --- Comparison Models ---
class ComparisonRequest(BaseModel):
    vehicle_ids: Optional[List[str]] = Field(default_factory=list, example=["vehicle-id-1", "vehicle-id-2"])
    variant_ids: Optional[List[str]] = Field(default_factory=list, example=["variant-id-1", "variant-id-2"])


class SpecMetric(BaseModel):
    name: str
    label: str
    values: Dict[str, Any]  # map of vehicle/variant ID -> formatted value or number
    unit: Optional[str] = None
    higher_is_better: Optional[bool] = None


class ComparisonResult(BaseModel):
    entities: List[Dict[str, Any]]
    specs: List[SpecMetric]
    radar_data: List[Dict[str, Any]]
    winner_highlights: List[str] = Field(default_factory=list)

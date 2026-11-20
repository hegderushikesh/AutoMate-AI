import json
import uuid
from typing import List, Dict, Any, Optional
import numpy as np

from app.core.config import get_settings
from app.core.supabase_client import get_supabase_client, is_supabase_configured

settings = get_settings()

# Default in-memory seed vehicles for instant out-of-the-box local operation
_SEED_VEHICLES = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "make": "Porsche",
        "model": "Taycan",
        "year": 2025,
        "body_type": "Sedan",
        "category": "Electric",
        "price_range": "$99,400 - $211,700",
        "hero_image_url": "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
        "overview": "The Porsche Taycan combines iconic Porsche sports car dynamics with cutting-edge 800-volt high-performance electric architecture, blistering acceleration, and advanced recuperation.",
        "variants": [
            {
                "id": "11111111-1111-1111-1111-222222222221",
                "vehicle_id": "11111111-1111-1111-1111-111111111111",
                "trim_name": "Taycan Base RWD",
                "price": 99400.0,
                "engine_type": "Permanent Magnet Synchronous Motor (Rear)",
                "displacement_cc": None,
                "horsepower_hp": 402,
                "torque_nm": 410,
                "transmission": "2-Speed Rear Axle Transmission",
                "drivetrain": "RWD",
                "fuel_type": "Electric",
                "fuel_economy": "83 MPGe (EPA Combined)",
                "seating_capacity": 4,
                "safety_rating_ncap": "5-Star",
                "key_features": [
                    "Adaptive Air Suspension with PASM",
                    "Porsche Recuperation Management (PRM)",
                    "Curved 16.8-inch Digital Instrument Cluster",
                    "LED Headlights with PDLS Plus",
                    "Wireless Apple CarPlay and Android Auto"
                ],
                "dimensions": {
                    "length_mm": 4963, "width_mm": 1966, "height_mm": 1395, "wheelbase_mm": 2900, "curb_weight_kg": 2050, "battery_kwh": 89.0, "range_miles": 274
                }
            },
            {
                "id": "11111111-1111-1111-1111-222222222222",
                "vehicle_id": "11111111-1111-1111-1111-111111111111",
                "trim_name": "Taycan 4S AWD",
                "price": 118500.0,
                "engine_type": "Dual Permanent Magnet Synchronous Motors",
                "displacement_cc": None,
                "horsepower_hp": 536,
                "torque_nm": 695,
                "transmission": "1-Speed Front / 2-Speed Rear Transmission",
                "drivetrain": "AWD",
                "fuel_type": "Electric",
                "fuel_economy": "82 MPGe (EPA Combined)",
                "seating_capacity": 4,
                "safety_rating_ncap": "5-Star",
                "key_features": [
                    "Porsche Traction Management (PTM)",
                    "Performance Battery Plus (105 kWh)",
                    "Adaptive 18-way Sport Seats Plus",
                    "Bose Surround Sound System",
                    "Lane Change Assist"
                ],
                "dimensions": {
                    "length_mm": 4963, "width_mm": 1966, "height_mm": 1379, "wheelbase_mm": 2900, "curb_weight_kg": 2180, "battery_kwh": 105.0, "range_miles": 318
                }
            },
            {
                "id": "11111111-1111-1111-1111-222222222223",
                "vehicle_id": "11111111-1111-1111-1111-111111111111",
                "trim_name": "Taycan Turbo S",
                "price": 209000.0,
                "engine_type": "Dual High-Output PSM Motors with Launch Overboost",
                "displacement_cc": None,
                "horsepower_hp": 938,
                "torque_nm": 1110,
                "transmission": "2-Speed High-Torque Performance Transmission",
                "drivetrain": "AWD",
                "fuel_type": "Electric",
                "fuel_economy": "78 MPGe (EPA Combined)",
                "seating_capacity": 4,
                "safety_rating_ncap": "5-Star",
                "key_features": [
                    "Porsche Ceramic Composite Brakes (PCCB)",
                    "Rear-Axle Steering with Power Steering Plus",
                    "Porsche Dynamic Chassis Control Sport (PDCC Sport)",
                    "Carbon Fiber Aerodynamic Package",
                    "0-60 mph in 2.3 seconds"
                ],
                "dimensions": {
                    "length_mm": 4963, "width_mm": 1966, "height_mm": 1378, "wheelbase_mm": 2900, "curb_weight_kg": 2295, "battery_kwh": 105.0, "range_miles": 295
                }
            }
        ]
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "make": "BMW",
        "model": "3 Series",
        "year": 2025,
        "body_type": "Sedan",
        "category": "Gasoline",
        "price_range": "$45,500 - $61,500",
        "hero_image_url": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
        "overview": "The quintessential luxury sports sedan offering legendary 50:50 weight distribution, BMW Curved Display with iDrive 8.5, and responsive TwinPower Turbo propulsion.",
        "variants": [
            {
                "id": "22222222-2222-2222-2222-333333333331",
                "vehicle_id": "22222222-2222-2222-2222-222222222222",
                "trim_name": "330i xDrive",
                "price": 47500.0,
                "engine_type": "2.0-liter BMW TwinPower Turbo Inline 4-Cylinder",
                "displacement_cc": 1998,
                "horsepower_hp": 255,
                "torque_nm": 400,
                "transmission": "8-Speed Sport Automatic with Paddle Shifters",
                "drivetrain": "AWD",
                "fuel_type": "Premium Unleaded",
                "fuel_economy": "24 MPG City / 33 MPG Hwy",
                "seating_capacity": 5,
                "safety_rating_ncap": "5-Star",
                "key_features": [
                    "BMW Curved Display (12.3-inch + 14.9-inch)",
                    "Active Blind Spot Detection",
                    "Frontal Collision Warning with City Collision Mitigation",
                    "Moonroof",
                    "Comfort Access Keyless Entry"
                ],
                "dimensions": {
                    "length_mm": 4713, "width_mm": 1827, "height_mm": 1440, "wheelbase_mm": 2851, "curb_weight_kg": 1690, "cargo_liters": 480
                }
            },
            {
                "id": "22222222-2222-2222-2222-333333333332",
                "vehicle_id": "22222222-2222-2222-2222-222222222222",
                "trim_name": "M340i xDrive",
                "price": 61500.0,
                "engine_type": "3.0-liter BMW M TwinPower Turbo Inline 6-Cylinder with 48V Mild Hybrid",
                "displacement_cc": 2998,
                "horsepower_hp": 386,
                "torque_nm": 540,
                "transmission": "8-Speed Sport Automatic with Launch Control",
                "drivetrain": "AWD",
                "fuel_type": "Premium Unleaded",
                "fuel_economy": "23 MPG City / 31 MPG Hwy",
                "seating_capacity": 5,
                "safety_rating_ncap": "5-Star",
                "key_features": [
                    "M Sport Differential",
                    "Adaptive M Suspension",
                    "Variable Sport Steering",
                    "M Sport Brakes with Blue Calipers",
                    "Aerodynamic Kit"
                ],
                "dimensions": {
                    "length_mm": 4713, "width_mm": 1827, "height_mm": 1440, "wheelbase_mm": 2851, "curb_weight_kg": 1795, "cargo_liters": 480
                }
            }
        ]
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "make": "Hyundai",
        "model": "Ioniq 5",
        "year": 2025,
        "body_type": "SUV",
        "category": "Electric",
        "price_range": "$42,500 - $66,100",
        "hero_image_url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80",
        "overview": "Retro-futuristic electric crossover built on the E-GMP platform with ultra-fast 350kW DC fast charging (10% to 80% in 18 minutes) and Vehicle-to-Load (V2L) two-way charging.",
        "variants": [
            {
                "id": "33333333-3333-3333-3333-444444444441",
                "vehicle_id": "33333333-3333-3333-3333-333333333333",
                "trim_name": "SEL Long Range AWD",
                "price": 51200.0,
                "engine_type": "Dual Electric Motors (Front & Rear)",
                "displacement_cc": None,
                "horsepower_hp": 320,
                "torque_nm": 605,
                "transmission": "Single-Speed Reduction Gear",
                "drivetrain": "AWD",
                "fuel_type": "Electric",
                "fuel_economy": "101 MPGe Combined",
                "seating_capacity": 5,
                "safety_rating_ncap": "5-Star",
                "key_features": [
                    "Highway Driving Assist II (HDA II)",
                    "Hands-free Smart Power Liftgate",
                    "Wireless Phone Charger",
                    "Ultra-fast 800V Multi-Charging Architecture",
                    "Heated Front Seats and Steering Wheel"
                ],
                "dimensions": {
                    "length_mm": 4635, "width_mm": 1890, "height_mm": 1605, "wheelbase_mm": 3000, "curb_weight_kg": 2095, "battery_kwh": 84.0, "range_miles": 269
                }
            },
            {
                "id": "33333333-3333-3333-3333-444444444442",
                "vehicle_id": "33333333-3333-3333-3333-333333333333",
                "trim_name": "Ioniq 5 N",
                "price": 66100.0,
                "engine_type": "Dual High-Output High-RPM Motors with N Grin Boost",
                "displacement_cc": None,
                "horsepower_hp": 641,
                "torque_nm": 770,
                "transmission": "Single-Speed with N e-Shift Virtual 8-Speed Paddle Transmission",
                "drivetrain": "AWD",
                "fuel_type": "Electric",
                "fuel_economy": "78 MPGe Combined",
                "seating_capacity": 5,
                "safety_rating_ncap": "5-Star",
                "key_features": [
                    "N e-Shift & N Active Sound+",
                    "N Drift Optimizer",
                    "N Torque Distribution (11-level)",
                    "Track-tuned Electronically Controlled Suspension",
                    "400mm Front Discs with 4-Piston Monobloc Calipers"
                ],
                "dimensions": {
                    "length_mm": 4715, "width_mm": 1940, "height_mm": 1585, "wheelbase_mm": 3000, "curb_weight_kg": 2230, "battery_kwh": 84.0, "range_miles": 221
                }
            }
        ]
    },
    {
        "id": "44444444-4444-4444-4444-444444444444",
        "make": "Ford",
        "model": "F-150 Lightning",
        "year": 2025,
        "body_type": "Truck",
        "category": "Electric",
        "price_range": "$57,000 - $87,000",
        "hero_image_url": "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1200&q=80",
        "overview": "The all-electric evolution of America's best-selling pickup truck featuring standard 4x4, Mega Power Frunk, Pro Power Onboard generator capabilities, and up to 10,000 lbs towing capacity.",
        "variants": [
            {
                "id": "44444444-4444-4444-4444-555555555551",
                "vehicle_id": "44444444-4444-4444-4444-444444444444",
                "trim_name": "Flash Extended Range",
                "price": 69995.0,
                "engine_type": "Dual In-Board Electric Motors",
                "displacement_cc": None,
                "horsepower_hp": 580,
                "torque_nm": 1050,
                "transmission": "Single-Speed Automatic Transaxle",
                "drivetrain": "AWD",
                "fuel_type": "Electric",
                "fuel_economy": "70 MPGe Combined",
                "seating_capacity": 5,
                "safety_rating_ncap": "5-Star",
                "key_features": [
                    "15.5-inch SYNC 4A Touchscreen",
                    "Ford BlueCruise Hands-Free Highway Driving",
                    "B&O Sound System",
                    "9.6 kW Pro Power Onboard Outlet System",
                    "Mega Power Frunk (400L / 400 lbs)"
                ],
                "dimensions": {
                    "length_mm": 5911, "width_mm": 2032, "height_mm": 1989, "wheelbase_mm": 3696, "curb_weight_kg": 2790, "battery_kwh": 131.0, "range_miles": 320, "towing_lbs": 8500
                }
            },
            {
                "id": "44444444-4444-4444-4444-555555555552",
                "vehicle_id": "44444444-4444-4444-4444-444444444444",
                "trim_name": "Platinum Extended Range",
                "price": 86995.0,
                "engine_type": "Dual In-Board Electric Motors High-Output",
                "displacement_cc": None,
                "horsepower_hp": 580,
                "torque_nm": 1050,
                "transmission": "Single-Speed Automatic Transaxle",
                "drivetrain": "AWD",
                "fuel_type": "Electric",
                "fuel_economy": "66 MPGe Combined",
                "seating_capacity": 5,
                "safety_rating_ncap": "5-Star",
                "key_features": [
                    "Nirvana Leather Multicontour Seats with Active Motion",
                    "Twin-Panel Panoramic Vista Roof",
                    "Max Trailer Tow Package",
                    "18-Speaker B&O Unleashed Sound System",
                    "22-inch Bright Machined Aluminum Wheels"
                ],
                "dimensions": {
                    "length_mm": 5911, "width_mm": 2032, "height_mm": 1989, "wheelbase_mm": 3696, "curb_weight_kg": 3120, "battery_kwh": 131.0, "range_miles": 300, "towing_lbs": 8500
                }
            }
        ]
    }
]

# In-memory local stores for documents, chunks, and chat
_LOCAL_VEHICLES = list(_SEED_VEHICLES)
_LOCAL_DOCUMENTS: List[Dict[str, Any]] = []
_LOCAL_CHUNKS: List[Dict[str, Any]] = []
_LOCAL_SESSIONS: List[Dict[str, Any]] = []
_LOCAL_MESSAGES: List[Dict[str, Any]] = []


class DatabaseRepository:
    """
    Unified database repository. Uses Supabase PostgreSQL + pgvector when configured,
    and falls back to persistent local storage for seamless development and testing.
    """

    @classmethod
    async def get_vehicles(cls) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("vehicles").select("*, variants(*)").execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[DatabaseRepository] Supabase fetch error, using local store: {e}")
        return _LOCAL_VEHICLES

    @classmethod
    async def get_vehicle_by_id(cls, vehicle_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("vehicles").select("*, variants(*)").eq("id", vehicle_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[DatabaseRepository] Supabase get vehicle error: {e}")

        for v in _LOCAL_VEHICLES:
            if str(v.get("id")) == str(vehicle_id):
                return v
        return None

    @classmethod
    async def create_vehicle(cls, vehicle_data: Dict[str, Any]) -> Dict[str, Any]:
        vehicle_id = vehicle_data.get("id") or str(uuid.uuid4())
        record = {**vehicle_data, "id": vehicle_id, "variants": vehicle_data.get("variants", [])}

        client = get_supabase_client()
        if client:
            try:
                # Insert vehicle without variants first
                clean_v = {k: v for k, v in record.items() if k != "variants"}
                client.table("vehicles").insert(clean_v).execute()
            except Exception as e:
                print(f"[DatabaseRepository] Supabase vehicle insert error: {e}")

        _LOCAL_VEHICLES.append(record)
        return record

    @classmethod
    async def add_variant(cls, vehicle_id: str, variant_data: Dict[str, Any]) -> Dict[str, Any]:
        variant_id = variant_data.get("id") or str(uuid.uuid4())
        record = {**variant_data, "id": variant_id, "vehicle_id": vehicle_id}

        client = get_supabase_client()
        if client:
            try:
                client.table("variants").insert(record).execute()
            except Exception as e:
                print(f"[DatabaseRepository] Supabase variant insert error: {e}")

        # Update local
        for v in _LOCAL_VEHICLES:
            if str(v.get("id")) == str(vehicle_id):
                v.setdefault("variants", []).append(record)
                break

        return record

    @classmethod
    async def save_document(cls, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = doc_data.get("id") or str(uuid.uuid4())
        record = {**doc_data, "id": doc_id}

        client = get_supabase_client()
        if client:
            try:
                client.table("documents").insert(record).execute()
            except Exception as e:
                print(f"[DatabaseRepository] Supabase document insert error: {e}")

        _LOCAL_DOCUMENTS.append(record)
        return record

    @classmethod
    async def update_document_status(cls, doc_id: str, status: str, total_pages: int = 0, error_message: str = None):
        client = get_supabase_client()
        if client:
            try:
                update_fields = {"status": status, "total_pages": total_pages}
                if error_message:
                    update_fields["error_message"] = error_message
                client.table("documents").update(update_fields).eq("id", doc_id).execute()
            except Exception as e:
                print(f"[DatabaseRepository] Supabase document update error: {e}")

        for d in _LOCAL_DOCUMENTS:
            if str(d.get("id")) == str(doc_id):
                d["status"] = status
                d["total_pages"] = total_pages
                if error_message:
                    d["error_message"] = error_message
                break

    @classmethod
    async def get_documents(cls) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("documents").select("*, vehicles(make, model, year)").order("created_at", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[DatabaseRepository] Supabase list documents error: {e}")
        return list(reversed(_LOCAL_DOCUMENTS))

    @classmethod
    async def save_document_chunks(cls, chunks: List[Dict[str, Any]]) -> int:
        client = get_supabase_client()
        if client:
            try:
                client.table("document_chunks").insert(chunks).execute()
            except Exception as e:
                print(f"[DatabaseRepository] Supabase chunk insert error: {e}")

        _LOCAL_CHUNKS.extend(chunks)
        return len(chunks)

    @classmethod
    async def vector_search(
        cls,
        query_embedding: List[float],
        match_threshold: float = 0.20,
        match_count: int = 5,
        filter_vehicle_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Performs vector similarity search via pgvector match_document_chunks RPC in Supabase,
        or cosine similarity via numpy across local chunks.
        """
        client = get_supabase_client()
        if client:
            try:
                rpc_params = {
                    "query_embedding": query_embedding,
                    "match_threshold": match_threshold,
                    "match_count": match_count,
                    "filter_vehicle_id": filter_vehicle_id,
                }
                res = client.rpc("match_document_chunks", rpc_params).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[DatabaseRepository] Supabase RPC vector search error: {e}")

        # Local cosine similarity fallback using numpy
        if not _LOCAL_CHUNKS or not query_embedding:
            return []

        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []

        results = []
        for ch in _LOCAL_CHUNKS:
            if filter_vehicle_id and str(ch.get("vehicle_id")) != str(filter_vehicle_id):
                continue
            emb = ch.get("embedding")
            if not emb:
                continue
            c_vec = np.array(emb, dtype=np.float32)
            c_norm = np.linalg.norm(c_vec)
            if c_norm == 0:
                continue
            cosine_sim = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))
            if cosine_sim >= match_threshold:
                # Find document filename
                doc_name = "OEM Brochure"
                for doc in _LOCAL_DOCUMENTS:
                    if str(doc.get("id")) == str(ch.get("document_id")):
                        doc_name = doc.get("filename", doc_name)
                        break

                results.append({
                    "id": ch.get("id", str(uuid.uuid4())),
                    "document_id": ch.get("document_id"),
                    "vehicle_id": ch.get("vehicle_id"),
                    "page_number": ch.get("page_number", 1),
                    "chunk_index": ch.get("chunk_index", 0),
                    "content": ch.get("content", ""),
                    "similarity": round(cosine_sim, 4),
                    "metadata": ch.get("metadata", {}),
                    "filename": doc_name,
                })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:match_count]

    @classmethod
    async def create_chat_session(cls, title: str = "Automotive Inquiry", vehicle_id: Optional[str] = None) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        record = {"id": session_id, "title": title, "vehicle_id": vehicle_id, "messages": []}

        client = get_supabase_client()
        if client:
            try:
                client.table("chat_sessions").insert({"id": session_id, "title": title, "vehicle_id": vehicle_id}).execute()
            except Exception as e:
                print(f"[DatabaseRepository] Supabase session error: {e}")

        _LOCAL_SESSIONS.append(record)
        return record

    @classmethod
    async def get_chat_sessions(cls) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("chat_sessions").select("*").order("updated_at", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[DatabaseRepository] Supabase get sessions error: {e}")
        return list(reversed(_LOCAL_SESSIONS))

    @classmethod
    async def save_chat_message(
        cls, session_id: str, role: str, content: str, citations: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        record = {
            "id": msg_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "citations": citations or [],
        }

        client = get_supabase_client()
        if client:
            try:
                client.table("chat_messages").insert(record).execute()
            except Exception as e:
                print(f"[DatabaseRepository] Supabase message insert error: {e}")

        _LOCAL_MESSAGES.append(record)
        for s in _LOCAL_SESSIONS:
            if str(s.get("id")) == str(session_id):
                s.setdefault("messages", []).append(record)
                break

        return record

    @classmethod
    async def get_session_messages(cls, session_id: str) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("chat_messages").select("*").eq("session_id", session_id).order("created_at", desc=False).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[DatabaseRepository] Supabase get messages error: {e}")

        return [m for m in _LOCAL_MESSAGES if str(m.get("session_id")) == str(session_id)]

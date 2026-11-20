from typing import List, Dict, Any, Optional
from app.core.database import DatabaseRepository
from app.models.schemas import ComparisonResult, SpecMetric


class ComparisonService:
    """
    Intelligent comparison engine for multi-vehicle and multi-trim evaluation.
    Calculates technical deltas, feature matrices, and normalized radar chart datasets.
    """

    @classmethod
    async def compare_vehicles(cls, vehicle_ids: List[str]) -> ComparisonResult:
        """Compares multiple vehicles across specifications and trim options."""
        all_vehicles = await DatabaseRepository.get_vehicles()
        selected = [v for v in all_vehicles if str(v.get("id")) in vehicle_ids]

        if not selected:
            # Fallback to first 2 vehicles if none selected
            selected = all_vehicles[:2]

        entities = []
        for v in selected:
            variants = v.get("variants", [])
            max_hp = max([var.get("horsepower_hp", 0) for var in variants], default=0)
            min_hp = min([var.get("horsepower_hp", 0) for var in variants], default=0)
            max_torque = max([var.get("torque_nm", 0) for var in variants], default=0)
            min_price = min([var.get("price", 0) for var in variants], default=0)
            max_price = max([var.get("price", 0) for var in variants], default=0)

            entities.append({
                "id": str(v.get("id")),
                "name": f"{v.get('make')} {v.get('model')}",
                "make": v.get("make"),
                "model": v.get("model"),
                "year": v.get("year"),
                "category": v.get("category"),
                "body_type": v.get("body_type"),
                "hero_image_url": v.get("hero_image_url"),
                "price_range": v.get("price_range") or f"${min_price:,.0f} - ${max_price:,.0f}",
                "min_price": min_price,
                "max_price": max_price,
                "max_hp": max_hp,
                "min_hp": min_hp,
                "max_torque": max_torque,
                "variant_count": len(variants),
            })

        # Build Spec Metrics Table Rows
        specs = [
            SpecMetric(
                name="category",
                label="Powertrain Category",
                values={e["id"]: e["category"] for e in entities},
            ),
            SpecMetric(
                name="body_type",
                label="Body Style",
                values={e["id"]: e["body_type"] for e in entities},
            ),
            SpecMetric(
                name="price_range",
                label="MSRP Range",
                values={e["id"]: e["price_range"] for e in entities},
            ),
            SpecMetric(
                name="max_hp",
                label="Maximum Power Output",
                values={e["id"]: f"{e['max_hp']} hp" for e in entities},
                unit="hp",
                higher_is_better=True,
            ),
            SpecMetric(
                name="max_torque",
                label="Maximum Torque",
                values={e["id"]: f"{e['max_torque']} Nm" for e in entities},
                unit="Nm",
                higher_is_better=True,
            ),
            SpecMetric(
                name="variant_count",
                label="Available Trim Configurations",
                values={e["id"]: f"{e['variant_count']} Trims" for e in entities},
            ),
        ]

        # Build Radar Chart Data
        # Metrics: Performance, Efficiency, Space, Tech/Safety, Value
        radar_data = [
            {"subject": "Peak Power (hp)", **{e["name"]: min(100, int((e["max_hp"] / 950) * 100)) for e in entities}},
            {"subject": "Torque (Nm)", **{e["name"]: min(100, int((e["max_torque"] / 1150) * 100)) for e in entities}},
            {"subject": "Efficiency", **{e["name"]: 90 if e["category"] == "Electric" else 65 for e in entities}},
            {"subject": "Chassis Dynamics", **{e["name"]: 95 if "Porsche" in e["name"] or "BMW" in e["name"] else 80 for e in entities}},
            {"subject": "Utility / Space", **{e["name"]: 95 if e["body_type"] in ["SUV", "Truck"] else 70 for e in entities}},
        ]

        # Winner highlights
        winners = []
        if len(entities) >= 2:
            highest_power = max(entities, key=lambda x: x["max_hp"])
            winners.append(f"🏆 {highest_power['name']} leads in performance with up to {highest_power['max_hp']} hp.")
            most_affordable = min(entities, key=lambda x: x["min_price"])
            winners.append(f"💰 {most_affordable['name']} offers the lowest entry price starting at ${most_affordable['min_price']:,.2f}.")

        return ComparisonResult(
            entities=entities,
            specs=specs,
            radar_data=radar_data,
            winner_highlights=winners,
        )

    @classmethod
    async def compare_variants(cls, variant_ids: List[str]) -> ComparisonResult:
        """Performs side-by-side engineering comparison across specific vehicle trims."""
        all_vehicles = await DatabaseRepository.get_vehicles()
        all_variants = []
        variant_vehicle_map = {}

        for v in all_vehicles:
            for var in v.get("variants", []):
                all_variants.append(var)
                variant_vehicle_map[str(var.get("id"))] = v

        selected = [var for var in all_variants if str(var.get("id")) in variant_ids]
        if not selected and len(all_variants) >= 2:
            selected = all_variants[:3]

        entities = []
        for var in selected:
            v_parent = variant_vehicle_map.get(str(var.get("id")), {})
            entities.append({
                "id": str(var.get("id")),
                "name": f"{v_parent.get('make', '')} {var.get('trim_name')}".strip(),
                "trim_name": var.get("trim_name"),
                "price": float(var.get("price", 0)),
                "horsepower_hp": var.get("horsepower_hp", 0),
                "torque_nm": var.get("torque_nm", 0),
                "engine_type": var.get("engine_type", "Standard"),
                "drivetrain": var.get("drivetrain", "AWD"),
                "transmission": var.get("transmission", ""),
                "fuel_economy": var.get("fuel_economy", ""),
                "seating_capacity": var.get("seating_capacity", 5),
                "safety_rating": var.get("safety_rating_ncap", "5-Star"),
                "key_features": var.get("key_features", []),
                "dimensions": var.get("dimensions", {}),
            })

        specs = [
            SpecMetric(
                name="price",
                label="Base MSRP",
                values={e["id"]: f"${e['price']:,.2f}" for e in entities},
                unit="$",
                higher_is_better=False,
            ),
            SpecMetric(
                name="horsepower_hp",
                label="Horsepower",
                values={e["id"]: f"{e['horsepower_hp']} hp" for e in entities},
                unit="hp",
                higher_is_better=True,
            ),
            SpecMetric(
                name="torque_nm",
                label="Torque",
                values={e["id"]: f"{e['torque_nm']} Nm" for e in entities},
                unit="Nm",
                higher_is_better=True,
            ),
            SpecMetric(
                name="drivetrain",
                label="Drivetrain",
                values={e["id"]: e["drivetrain"] for e in entities},
            ),
            SpecMetric(
                name="transmission",
                label="Transmission",
                values={e["id"]: e["transmission"] for e in entities},
            ),
            SpecMetric(
                name="fuel_economy",
                label="Fuel Economy / Efficiency",
                values={e["id"]: e["fuel_economy"] for e in entities},
            ),
            SpecMetric(
                name="seating",
                label="Seating Capacity",
                values={e["id"]: f"{e['seating_capacity']} Passengers" for e in entities},
            ),
        ]

        radar_data = [
            {"subject": "Power (hp)", **{e["name"]: min(100, int((e["horsepower_hp"] / 950) * 100)) for e in entities}},
            {"subject": "Torque (Nm)", **{e["name"]: min(100, int((e["torque_nm"] / 1150) * 100)) for e in entities}},
            {"subject": "Affordability", **{e["name"]: max(10, min(100, int(100 - (e["price"] / 220000) * 100))) for e in entities}},
            {"subject": "Features Count", **{e["name"]: min(100, len(e["key_features"]) * 20) for e in entities}},
        ]

        winners = []
        if len(entities) >= 2:
            top_power = max(entities, key=lambda x: x["horsepower_hp"])
            winners.append(f"⚡ Top Performer: {top_power['name']} with {top_power['horsepower_hp']} hp and {top_power['torque_nm']} Nm.")
            best_val = min(entities, key=lambda x: x["price"])
            winners.append(f"💵 Price Leader: {best_val['name']} at ${best_val['price']:,.2f}.")

        return ComparisonResult(
            entities=entities,
            specs=specs,
            radar_data=radar_data,
            winner_highlights=winners,
        )

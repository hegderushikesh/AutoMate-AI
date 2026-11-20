import unittest
from fastapi.testclient import TestClient
from app.main import app


class VehicleEndpointTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_list_vehicles_all(self):
        resp = self.client.get("/api/vehicles")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(len(data), 4)

        makes = [v["make"] for v in data]
        self.assertIn("Porsche", makes)
        self.assertIn("BMW", makes)
        self.assertIn("Hyundai", makes)
        self.assertIn("Ford", makes)

    def test_list_vehicles_filter_electric(self):
        resp = self.client.get("/api/vehicles?category=Electric")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(len(data), 3)
        for v in data:
            self.assertEqual(v["category"], "Electric")

    def test_list_vehicles_filter_gasoline(self):
        resp = self.client.get("/api/vehicles?category=Gasoline")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(len(data), 1)
        self.assertEqual(data[0]["make"], "BMW")

    def test_get_vehicle_detail(self):
        # Fetch Taycan
        resp = self.client.get("/api/vehicles/11111111-1111-1111-1111-111111111111")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["make"], "Porsche")
        self.assertEqual(data["model"], "Taycan")
        self.assertGreaterEqual(len(data["variants"]), 3)

        # Check trims
        trim_names = [var["trim_name"] for var in data["variants"]]
        self.assertIn("Taycan 4S AWD", trim_names)
        self.assertIn("Taycan Turbo S", trim_names)

    def test_get_vehicle_not_found(self):
        resp = self.client.get("/api/vehicles/non-existent-id-999")
        self.assertEqual(resp.status_code, 404)
        self.assertIn("not found", resp.json()["detail"])

    def test_create_vehicle_and_add_variant(self):
        new_car = {
            "make": "Audi",
            "model": "e-tron GT",
            "year": 2025,
            "body_type": "Sedan",
            "category": "Electric",
            "price_range": "$106,500 - $167,000",
            "overview": "Grand touring electric sports car with dual-motor quattro.",
        }
        create_resp = self.client.post("/api/vehicles", json=new_car)
        self.assertEqual(create_resp.status_code, 201)
        created_data = create_resp.json()
        v_id = created_data["id"]
        self.assertEqual(created_data["make"], "Audi")

        # Add variant
        variant_payload = {
            "trim_name": "RS e-tron GT",
            "price": 147500.0,
            "engine_type": "Dual Synchronous Electric Motors",
            "horsepower_hp": 637,
            "torque_nm": 830,
            "transmission": "2-Speed Rear / 1-Speed Front",
            "drivetrain": "AWD",
            "fuel_type": "Electric",
            "fuel_economy": "85 MPGe Combined",
            "seating_capacity": 5,
            "safety_rating_ncap": "5-Star",
            "key_features": ["Carbon Roof", "Tungsten Carbide Brakes"],
            "dimensions": {"length_mm": 4989, "curb_weight_kg": 2330},
        }
        var_resp = self.client.post(f"/api/vehicles/{v_id}/variants", json=variant_payload)
        self.assertEqual(var_resp.status_code, 201)
        var_data = var_resp.json()
        self.assertEqual(var_data["trim_name"], "RS e-tron GT")
        self.assertEqual(var_data["horsepower_hp"], 637)


if __name__ == "__main__":
    unittest.main()

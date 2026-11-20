import os
os.environ["TESTING"] = "1"

import unittest
from fastapi.testclient import TestClient
from app.main import app


class ComparisonEndpointTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.taycan_id = "11111111-1111-1111-1111-111111111111"
        self.bmw_id = "22222222-2222-2222-2222-222222222222"

    def test_compare_vehicles(self):
        payload = {"vehicle_ids": [self.taycan_id, self.bmw_id]}
        resp = self.client.post("/api/compare/vehicles", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertEqual(len(data["entities"]), 2)
        entity_names = [e["name"] for e in data["entities"]]
        self.assertIn("Porsche Taycan", entity_names)
        self.assertIn("BMW 3 Series", entity_names)

        # Verify spec rows
        spec_names = [s["name"] for s in data["specs"]]
        self.assertIn("max_hp", spec_names)
        self.assertIn("max_torque", spec_names)
        self.assertIn("price_range", spec_names)

        # Verify radar data
        self.assertGreaterEqual(len(data["radar_data"]), 4)
        subjects = [r["subject"] for r in data["radar_data"]]
        self.assertIn("Peak Power (hp)", subjects)

        # Verify winner highlights
        self.assertGreaterEqual(len(data["winner_highlights"]), 1)

    def test_compare_variants(self):
        # Taycan Base and Taycan Turbo S variant IDs
        v_base = "11111111-1111-1111-1111-222222222221"
        v_turbo_s = "11111111-1111-1111-1111-222222222223"

        payload = {"variant_ids": [v_base, v_turbo_s]}
        resp = self.client.post("/api/compare/variants", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertEqual(len(data["entities"]), 2)
        hps = [e["horsepower_hp"] for e in data["entities"]]
        self.assertIn(402, hps)
        self.assertIn(938, hps)

        # Verify specs table
        spec_names = [s["name"] for s in data["specs"]]
        self.assertIn("horsepower_hp", spec_names)
        self.assertIn("torque_nm", spec_names)
        self.assertIn("price", spec_names)

        # Winner highlights
        self.assertGreaterEqual(len(data["winner_highlights"]), 1)


if __name__ == "__main__":
    unittest.main()

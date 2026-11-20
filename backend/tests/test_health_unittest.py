import os
os.environ["TESTING"] = "1"

import unittest
from fastapi.testclient import TestClient
from app.main import app


class HealthEndpointTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("AutoMate AI", data["message"])
        self.assertEqual(data["health"], "/api/health")

    def test_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("ollama", data)
        self.assertIn("database", data)


if __name__ == "__main__":
    unittest.main()

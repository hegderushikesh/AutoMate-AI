import os
os.environ["TESTING"] = "1"

import unittest
import asyncio
from app.core.database import DatabaseRepository


class DatabaseRepositoryTests(unittest.TestCase):
    def test_get_vehicles_and_seed(self):
        vehicles = asyncio.run(DatabaseRepository.get_vehicles())
        self.assertGreaterEqual(len(vehicles), 4)

        # Verify Porsche Taycan and BMW 3 Series exist
        makes = [v["make"] for v in vehicles]
        self.assertIn("Porsche", makes)
        self.assertIn("BMW", makes)

        taycan = next(v for v in vehicles if v["make"] == "Porsche")
        self.assertGreaterEqual(len(taycan["variants"]), 3)
        self.assertEqual(taycan["variants"][0]["trim_name"], "Taycan Base RWD")

    def test_vector_search_local(self):
        # Insert a dummy chunk with a known 384d vector
        dummy_chunk = {
            "document_id": "doc-test-1",
            "vehicle_id": "11111111-1111-1111-1111-111111111111",
            "page_number": 4,
            "chunk_index": 0,
            "content": "The Porsche Taycan utilizes an 800-volt battery architecture capable of 320 kW charging.",
            "embedding": [0.1] * 384,
            "metadata": {"section": "Charging & Battery"},
        }
        asyncio.run(DatabaseRepository.save_document_chunks([dummy_chunk]))

        # Search with the exact same vector
        query_vec = [0.1] * 384
        results = asyncio.run(DatabaseRepository.vector_search(query_vec, match_threshold=0.9))
        self.assertGreaterEqual(len(results), 1)
        self.assertAlmostEqual(results[0]["similarity"], 1.0, places=2)
        self.assertIn("800-volt battery", results[0]["content"])


if __name__ == "__main__":
    unittest.main()

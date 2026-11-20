import os
import unittest
from unittest.mock import patch, AsyncMock, MagicMock
from starlette.testclient import TestClient

from app.main import app
from app.core.config import get_settings
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import (
    LLMService,
    LLMAuthenticationError,
    LLMRateLimitError,
    LLMTimeoutError,
)
from app.core.database import DatabaseRepository
from app.services.rag_engine import RAGEngine

settings = get_settings()


class GroqMigrationTestSuite(unittest.IsolatedAsyncioTestCase):
    """
    Comprehensive test suite verifying the Groq Cloud & fastembed migration.
    """

    def setUp(self):
        self.client = TestClient(app)
        import asyncio
        asyncio.run(DatabaseRepository.seed_default_brochures_if_empty())

    # 1. Test Embedding Generation & 384-dimension compliance
    async def test_fastembed_384d_embedding(self):
        query = "What is the battery capacity of the Porsche Taycan?"
        embedding = await EmbeddingService.generate_embedding(query)
        self.assertEqual(len(embedding), 384, "Embedding must be exactly 384 dimensions")
        self.assertTrue(any(embedding), "Embedding vector must not be all zeros")

    # 2. Test Batch Embedding
    async def test_fastembed_batch_embeddings(self):
        texts = [
            "Porsche Taycan Turbo S",
            "800-volt high-speed charging architecture",
            "Hyundai Ioniq 5 E-GMP platform",
        ]
        embeddings = await EmbeddingService.generate_batch_embeddings(texts)
        self.assertEqual(len(embeddings), 3)
        for emb in embeddings:
            self.assertEqual(len(emb), 384)

    # 3. Test Vector Similarity Retrieval
    async def test_vector_search_retrieval(self):
        await DatabaseRepository.seed_default_brochures_if_empty()
        query_vec = await EmbeddingService.generate_embedding("charging voltage rate")
        results = await DatabaseRepository.vector_search(
            query_embedding=query_vec,
            match_threshold=0.15,
            match_count=3,
        )
        self.assertGreater(len(results), 0, "Vector retrieval should match seeded brochure chunks")
        self.assertIn("content", results[0])
        self.assertIn("page_number", results[0])
        self.assertIn("filename", results[0])

    # 4. Test Health Endpoint
    def test_health_endpoint_groq_and_embeddings(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("groq", data)
        self.assertIn("embeddings", data)
        self.assertEqual(data["embeddings"]["dimension"], 384)
        self.assertEqual(data["embeddings"]["provider"], "fastembed (ONNX runtime)")

    # 5. Test Greeting Chat Response (Intent Classification)
    def test_greeting_chat_response(self):
        resp = self.client.post("/api/chat", json={"message": "hello"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("AutoMate AI", data["answer"])
        self.assertEqual(data["sources"], [])
        self.assertIsNotNone(data["session_id"])

    # 6. Test Out-of-Context Refusal
    def test_out_of_context_question(self):
        resp = self.client.post(
            "/api/chat",
            json={"message": "What is the orbital velocity of the International Space Station?"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["answer"], "Not found in the brochure.")
        self.assertEqual(data["sources"], [])

    # 7. Test Groq Authentication Error handling when key is missing/invalid
    def test_groq_missing_api_key_error_handling(self):
        with patch.object(settings, "GROQ_API_KEY", ""):
            with patch.dict(os.environ, {"GROQ_API_KEY": ""}):
                resp = self.client.post(
                    "/api/chat",
                    json={
                        "message": "What is the horsepower of the Taycan?",
                        "vehicle_id": "11111111-1111-1111-1111-111111111111",
                    },
                )
                self.assertEqual(resp.status_code, 401)
                data = resp.json()
                self.assertIn("GROQ_API_KEY", str(data))

    # 8. Test Groq Success Response with Grounded RAG Citations
    def test_groq_grounded_rag_with_citations(self):
        mock_groq_response = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = (
            "The Porsche Taycan features an 800-volt high-voltage architecture with a maximum "
            "DC fast charging rate of 320 kW [Doc: 2025_Porsche_Taycan_Brochure.pdf, Page: 3]."
        )
        mock_groq_response.choices = [mock_choice]

        with patch("app.services.llm_service.AsyncGroq") as mock_groq_cls:
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(return_value=mock_groq_response)
            mock_groq_cls.return_value = mock_client

            with patch.object(settings, "GROQ_API_KEY", "gsk_mock_valid_key_12345"):
                resp = self.client.post(
                    "/api/chat",
                    json={
                        "message": "What is the charging voltage architecture of the Taycan?",
                        "vehicle_id": "11111111-1111-1111-1111-111111111111",
                    },
                )
                self.assertEqual(resp.status_code, 200)
                data = resp.json()
                self.assertIn("800-volt", data["answer"])
                self.assertGreater(len(data["sources"]), 0)
                self.assertEqual(data["sources"][0]["document_name"], "2025_Porsche_Taycan_Brochure.pdf")

    # 9. Test Vehicle Comparison Endpoint
    def test_vehicle_comparison(self):
        resp = self.client.post(
            "/api/compare/vehicles",
            json={"vehicle_ids": ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"]},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("entities", data)
        self.assertIn("specs", data)
        self.assertIn("radar_data", data)
        self.assertIn("winner_highlights", data)

    # 10. Test Chat History Persistence
    async def test_chat_history_persistence(self):
        session = await DatabaseRepository.create_chat_session(title="Groq History Test")
        s_id = session["id"]

        await DatabaseRepository.save_chat_message(
            session_id=s_id, role="user", content="Test question from driver"
        )
        await DatabaseRepository.save_chat_message(
            session_id=s_id, role="assistant", content="Test answer grounded in brochure"
        )

        messages = await DatabaseRepository.get_session_messages(s_id)
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0]["content"], "Test question from driver")
        self.assertEqual(messages[1]["content"], "Test answer grounded in brochure")


if __name__ == "__main__":
    unittest.main()

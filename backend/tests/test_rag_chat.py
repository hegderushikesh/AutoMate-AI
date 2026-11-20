import os
import unittest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.services.pdf_processor import PDFProcessor
from app.services.embedding_service import EmbeddingService
from app.core.database import DatabaseRepository


class RAGChatEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Index sample Taycan brochure so the RAG engine has real chunks in the store
        cls.taycan_pdf = os.path.join("sample_brochures", "2025_Porsche_Taycan_Brochure.pdf")
        if os.path.exists(cls.taycan_pdf):
            pages = PDFProcessor.extract_text_by_pages(cls.taycan_pdf)
            chunks = PDFProcessor.chunk_document(
                pages_data=pages,
                document_id="doc-taycan-sample",
                vehicle_id="11111111-1111-1111-1111-111111111111",
                filename="2025_Porsche_Taycan_Brochure.pdf",
            )
            texts = [c["content"] for c in chunks]
            embeddings = asyncio.run(EmbeddingService.generate_batch_embeddings(texts))
            for idx, c in enumerate(chunks):
                c["embedding"] = embeddings[idx]

            asyncio.run(DatabaseRepository.save_document_chunks(chunks))

            doc_meta = {
                "id": "doc-taycan-sample",
                "vehicle_id": "11111111-1111-1111-1111-111111111111",
                "filename": "2025_Porsche_Taycan_Brochure.pdf",
                "file_path": cls.taycan_pdf,
                "file_size_bytes": os.path.getsize(cls.taycan_pdf),
                "total_pages": len(pages),
                "status": "indexed",
            }
            asyncio.run(DatabaseRepository.save_document(doc_meta))

    def setUp(self):
        self.client = TestClient(app)

    def test_grounded_charging_query_with_citations(self):
        payload = {
            "message": "What is the charging voltage architecture and maximum DC fast charging rate of the Taycan?",
            "vehicle_id": "11111111-1111-1111-1111-111111111111",
        }
        resp = self.client.post("/api/chat/message", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertIn("session_id", data)
        self.assertEqual(data["role"], "assistant")
        answer = data["content"].lower()

        # The answer must be grounded in the brochure
        self.assertTrue(
            "800" in answer or "320" in answer or "kw" in answer or "volt" in answer or "charging" in answer
        )

        # Citations must be populated
        self.assertGreaterEqual(len(data["citations"]), 1)
        citation_pages = [c["page_number"] for c in data["citations"]]
        self.assertIn(3, citation_pages)

    def test_anti_hallucination_for_unavailable_information(self):
        payload = {
            "message": "What is the warp drive multiplier, lunar landing gear, and hyperdrive rating for the BMW 3 Series?",
            "vehicle_id": "22222222-2222-2222-2222-222222222222",
        }
        resp = self.client.post("/api/chat/message", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        answer = data["content"].lower()

        # Must refuse or state not available
        self.assertTrue(
            "not available" in answer
            or "no mention" in answer
            or "does not contain" in answer
            or "not provided" in answer
            or "cannot be determined" in answer
        )

    def test_session_history_retrieval(self):
        # 1. Create a session with a message
        payload = {
            "message": "What is the horsepower of the Taycan Turbo S?",
            "vehicle_id": "11111111-1111-1111-1111-111111111111",
        }
        resp1 = self.client.post("/api/chat/message", json=payload)
        session_id = resp1.json()["session_id"]

        # 2. Retrieve history
        history_resp = self.client.get(f"/api/chat/sessions/{session_id}/messages")
        self.assertEqual(history_resp.status_code, 200)
        hist_data = history_resp.json()

        self.assertEqual(hist_data["session_id"], session_id)
        self.assertGreaterEqual(hist_data["message_count"], 2)  # User question + assistant answer
        roles = [m["role"] for m in hist_data["messages"]]
        self.assertIn("user", roles)
        self.assertIn("assistant", roles)


if __name__ == "__main__":
    unittest.main()

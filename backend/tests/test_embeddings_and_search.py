import os
import unittest
import asyncio
from app.services.pdf_processor import PDFProcessor
from app.services.embedding_service import EmbeddingService
from app.services.vector_search import VectorSearchService
from app.core.database import DatabaseRepository


class EmbeddingsAndVectorSearchTests(unittest.TestCase):
    def setUp(self):
        self.taycan_pdf = os.path.join("sample_brochures", "2025_Porsche_Taycan_Brochure.pdf")

    def test_ollama_embedding_generation(self):
        embedding = asyncio.run(EmbeddingService.generate_embedding("Porsche 800V DC fast charging architecture"))
        self.assertEqual(len(embedding), 384)
        self.assertTrue(any(x != 0.0 for x in embedding))

    def test_end_to_end_ingestion_and_search(self):
        # 1. Extract pages
        pages = PDFProcessor.extract_text_by_pages(self.taycan_pdf)
        doc_id = "test-doc-taycan-brochure"
        vehicle_id = "11111111-1111-1111-1111-111111111111"

        # 2. Chunk
        chunks = PDFProcessor.chunk_document(
            pages_data=pages,
            document_id=doc_id,
            vehicle_id=vehicle_id,
            filename="2025_Porsche_Taycan_Brochure.pdf",
        )

        # 3. Generate embeddings
        texts = [c["content"] for c in chunks]
        embeddings = asyncio.run(EmbeddingService.generate_batch_embeddings(texts))
        self.assertEqual(len(embeddings), len(chunks))

        for idx, chunk in enumerate(chunks):
            chunk["embedding"] = embeddings[idx]

        # 4. Save to repository
        asyncio.run(DatabaseRepository.save_document_chunks(chunks))

        # 5. Search for charging speed
        search_query = "What is the maximum DC charging rate in kW and charging time for the Taycan?"
        matches = asyncio.run(VectorSearchService.search_relevant_chunks(
            query=search_query,
            vehicle_id=vehicle_id,
            top_k=3,
            match_threshold=0.25,
        ))

        self.assertGreaterEqual(len(matches), 1)
        top_match = matches[0]

        # The charging info is specifically on Page 3
        page_numbers = [m["page_number"] for m in matches]
        self.assertIn(3, page_numbers)
        self.assertTrue(
            any("320 kW" in m["content"] or "800-volt" in m["content"] for m in matches)
        )


if __name__ == "__main__":
    unittest.main()

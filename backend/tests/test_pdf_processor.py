import os
import unittest
from app.services.pdf_processor import PDFProcessor


class PDFProcessorTests(unittest.TestCase):
    def setUp(self):
        self.taycan_pdf = os.path.join("sample_brochures", "2025_Porsche_Taycan_Brochure.pdf")
        self.bmw_pdf = os.path.join("sample_brochures", "2025_BMW_3_Series_Brochure.pdf")

    def test_extract_pages_taycan(self):
        self.assertTrue(os.path.exists(self.taycan_pdf))
        pages = PDFProcessor.extract_text_by_pages(self.taycan_pdf)
        self.assertEqual(len(pages), 4)

        # Page numbers should be 1-indexed
        page_nums = [p["page_number"] for p in pages]
        self.assertEqual(page_nums, [1, 2, 3, 4])

        # Page 2 should contain performance metrics
        self.assertIn("Turbo S", pages[1]["text"])
        self.assertIn("938 hp", pages[1]["text"])

        # Page 3 should contain 800-volt charging info
        self.assertIn("800-volt", pages[2]["text"])
        self.assertIn("320 kW", pages[2]["text"])

    def test_chunking_preserves_page_provenance(self):
        pages = PDFProcessor.extract_text_by_pages(self.taycan_pdf)
        chunks = PDFProcessor.chunk_document(
            pages_data=pages,
            document_id="doc-taycan-uuid",
            vehicle_id="vehicle-taycan-uuid",
            filename="2025_Porsche_Taycan_Brochure.pdf",
        )

        self.assertGreaterEqual(len(chunks), 4)
        for c in chunks:
            self.assertIn("page_number", c)
            self.assertIn(c["page_number"], [1, 2, 3, 4])
            self.assertEqual(c["document_id"], "doc-taycan-uuid")
            self.assertEqual(c["vehicle_id"], "vehicle-taycan-uuid")
            self.assertGreater(len(c["content"]), 25)

    def test_clean_text(self):
        messy = "Porsche   Taycan\n\n\n\nperfor-\nmance is unmatched."
        cleaned = PDFProcessor.clean_text(messy)
        self.assertEqual(cleaned, "Porsche Taycan\n\nperformance is unmatched.")


if __name__ == "__main__":
    unittest.main()

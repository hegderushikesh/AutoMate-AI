import os
import re
from typing import List, Dict, Any, Tuple
import fitz  # PyMuPDF


class PDFProcessor:
    """
    High-fidelity PDF processing engine using PyMuPDF (fitz).
    Preserves page provenance for grounded RAG source citations.
    """

    CHUNK_SIZE = 500  # Target characters per chunk
    CHUNK_OVERLAP = 100  # Character overlap between adjacent chunks

    @classmethod
    def extract_text_by_pages(cls, file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts clean text from a PDF file page-by-page.
        Returns a list of dicts: [{'page_number': 1, 'text': '...', 'char_count': 120}, ...]
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at: {file_path}")

        pages_data = []
        doc = fitz.open(file_path)

        try:
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                page_num = page_idx + 1  # 1-indexed for human citations

                # Extract text preserving blocks
                raw_text = page.get_text("text")

                # Clean and normalize whitespace while preserving meaningful newlines
                cleaned_text = cls.clean_text(raw_text)

                if cleaned_text.strip():
                    pages_data.append({
                        "page_number": page_num,
                        "text": cleaned_text,
                        "char_count": len(cleaned_text),
                    })
        finally:
            doc.close()

        return pages_data

    @classmethod
    def clean_text(cls, text: str) -> str:
        """Normalizes excessive whitespace, strange unicode artifacts, and hyphenated line breaks."""
        if not text:
            return ""

        # Remove null bytes
        text = text.replace("\x00", "")

        # Join hyphenated words split across lines: e.g. "perfor-\nmance" -> "performance"
        text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)

        # Replace multiple horizontal spaces with a single space
        text = re.sub(r'[ \t]+', ' ', text)

        # Normalize 3 or more consecutive newlines to two newlines
        text = re.sub(r'\n{3,}', '\n\n', text)

        return text.strip()

    @classmethod
    def chunk_document(
        cls,
        pages_data: List[Dict[str, Any]],
        document_id: str,
        vehicle_id: str = None,
        filename: str = "",
    ) -> List[Dict[str, Any]]:
        """
        Splits page text into semantically cohesive chunks with sliding window overlap.
        Preserves exact page numbers for accurate citation grounding.
        """
        chunks = []
        global_chunk_idx = 0

        for page_item in pages_data:
            page_num = page_item["page_number"]
            page_text = page_item["text"]

            page_chunks = cls._chunk_single_page(page_text)

            for chunk_content in page_chunks:
                if len(chunk_content.strip()) < 25:
                    continue  # Skip negligible fragments

                chunks.append({
                    "document_id": document_id,
                    "vehicle_id": vehicle_id,
                    "page_number": page_num,
                    "chunk_index": global_chunk_idx,
                    "content": chunk_content.strip(),
                    "metadata": {
                        "filename": filename,
                        "page_number": page_num,
                        "chunk_index": global_chunk_idx,
                        "length": len(chunk_content.strip()),
                    },
                })
                global_chunk_idx += 1

        return chunks

    @classmethod
    def _chunk_single_page(cls, text: str) -> List[str]:
        """
        Chunks text within a single page using sentence or paragraph boundaries.
        """
        if len(text) <= cls.CHUNK_SIZE:
            return [text]

        # Break text into paragraphs or sentences
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""

        for p in paragraphs:
            p = p.strip()
            if not p:
                continue

            if len(current_chunk) + len(p) + 2 <= cls.CHUNK_SIZE:
                current_chunk = f"{current_chunk}\n\n{p}".strip()
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                # If paragraph itself is too large, split by sentences
                if len(p) > cls.CHUNK_SIZE:
                    sub_chunks = cls._split_by_sentences(p)
                    for sc in sub_chunks[:-1]:
                        chunks.append(sc)
                    current_chunk = sub_chunks[-1] if sub_chunks else ""
                else:
                    current_chunk = p

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    @classmethod
    def _split_by_sentences(cls, text: str) -> List[str]:
        """Splits large text blocks by sentence boundaries with overlap."""
        # Split on period, exclamation, or question mark followed by space or newline
        sentences = re.split(r'(?<=[.!?])\s+', text)
        result = []
        current = ""

        for s in sentences:
            if len(current) + len(s) + 1 <= cls.CHUNK_SIZE:
                current = f"{current} {s}".strip()
            else:
                if current:
                    result.append(current)
                current = s

        if current:
            result.append(current)

        return result

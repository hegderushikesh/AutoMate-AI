import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.core.config import get_settings
from app.core.database import DatabaseRepository
from app.services.pdf_processor import PDFProcessor
from app.services.embedding_service import EmbeddingService
from app.models.schemas import DocumentResponse

router = APIRouter()
settings = get_settings()


@router.get("", response_model=List[DocumentResponse])
async def list_documents():
    """List all uploaded automotive PDF brochures and their processing status."""
    docs = await DatabaseRepository.get_documents()
    return docs


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    vehicle_id: Optional[str] = Form(None),
):
    """
    Upload an OEM vehicle PDF brochure, extract text page-by-page with PyMuPDF,
    generate vector embeddings with Ollama, and index chunks in Supabase pgvector.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported (.pdf).",
        )

    doc_id = str(uuid.uuid4())
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_filename = f"{doc_id}_{os.path.basename(file.filename)}"
    local_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    # 1. Save uploaded file to local disk
    try:
        with open(local_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}",
        )

    file_size = os.path.getsize(local_path)

    # 2. Register document in database with 'processing' status
    doc_record = {
        "id": doc_id,
        "vehicle_id": vehicle_id if vehicle_id and vehicle_id != "null" else None,
        "filename": file.filename,
        "file_path": local_path,
        "storage_path": safe_filename,
        "file_size_bytes": file_size,
        "total_pages": 0,
        "status": "processing",
        "error_message": None,
    }
    await DatabaseRepository.save_document(doc_record)

    # 3. Process PDF with PyMuPDF
    try:
        pages_data = PDFProcessor.extract_text_by_pages(local_path)
        total_pages = len(pages_data)

        if total_pages == 0:
            await DatabaseRepository.update_document_status(
                doc_id, status="failed", total_pages=0, error_message="No readable text found in PDF."
            )
            doc_record["status"] = "failed"
            doc_record["error_message"] = "No readable text found in PDF."
            return doc_record

        # 4. Chunk document preserving page provenance
        chunks = PDFProcessor.chunk_document(
            pages_data=pages_data,
            document_id=doc_id,
            vehicle_id=vehicle_id if vehicle_id and vehicle_id != "null" else None,
            filename=file.filename,
        )

        # 5. Generate embeddings with local Ollama all-minilm
        texts = [c["content"] for c in chunks]
        embeddings = await EmbeddingService.generate_batch_embeddings(texts)

        # Attach embeddings to chunks
        for idx, chunk in enumerate(chunks):
            chunk["embedding"] = embeddings[idx]

        # 6. Store in pgvector / database
        await DatabaseRepository.save_document_chunks(chunks)

        # 7. Update status to 'indexed'
        await DatabaseRepository.update_document_status(
            doc_id=doc_id,
            status="indexed",
            total_pages=total_pages,
        )

        doc_record["status"] = "indexed"
        doc_record["total_pages"] = total_pages
        return doc_record

    except Exception as e:
        print(f"[DocumentUpload] Processing error: {e}")
        await DatabaseRepository.update_document_status(
            doc_id=doc_id,
            status="failed",
            total_pages=0,
            error_message=str(e),
        )
        doc_record["status"] = "failed"
        doc_record["error_message"] = str(e)
        return doc_record


@router.get("/{doc_id}/chunks")
async def get_document_chunks(doc_id: str):
    """Retrieve indexed chunks and page numbers for a brochure."""
    # Search local or db for chunks belonging to doc_id
    from app.core.database import _LOCAL_CHUNKS
    matching = [
        {
            "id": c.get("id"),
            "page_number": c.get("page_number"),
            "chunk_index": c.get("chunk_index"),
            "content": c.get("content"),
            "metadata": c.get("metadata", {}),
        }
        for c in _LOCAL_CHUNKS
        if str(c.get("document_id")) == str(doc_id)
    ]
    return {
        "document_id": doc_id,
        "chunk_count": len(matching),
        "chunks": matching,
    }


@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
async def delete_document(doc_id: str):
    """Delete an uploaded brochure and all its associated vector chunks."""
    success = await DatabaseRepository.delete_document(doc_id)
    return {"success": success, "deleted_id": doc_id}

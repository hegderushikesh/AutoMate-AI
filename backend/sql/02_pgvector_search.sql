-- ============================================================================
-- AutoMate AI - Vector Similarity Search & HNSW Index (02_pgvector_search.sql)
-- ============================================================================

-- 1. Create HNSW (Hierarchical Navigable Small World) index for 384d Cosine distance
-- HNSW offers faster search and better recall than standard IVFFlat
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 2. Stored Procedure for Semantic Similarity Retrieval
-- Returns top matching brochure chunks grounded with vehicle and page metadata
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.25,
    match_count int DEFAULT 5,
    filter_vehicle_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    vehicle_id UUID,
    page_number INT,
    chunk_index INT,
    content TEXT,
    similarity float,
    metadata JSONB,
    filename VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.vehicle_id,
        dc.page_number,
        dc.chunk_index,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        dc.metadata,
        d.filename
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE (filter_vehicle_id IS NULL OR dc.vehicle_id = filter_vehicle_id)
      AND (1 - (dc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY dc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

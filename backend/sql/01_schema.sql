-- ============================================================================
-- AutoMate AI - Database Schema (01_schema.sql)
-- Supabase PostgreSQL with pgvector extension
-- ============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Vehicles Table (Master catalog of automobiles)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    body_type VARCHAR(50) NOT NULL, -- e.g., Sedan, SUV, Coupe, Truck
    category VARCHAR(50) NOT NULL,  -- e.g., Electric, Hybrid, Gasoline, Diesel
    price_range VARCHAR(100),       -- e.g., "$45,000 - $65,000"
    hero_image_url TEXT,
    overview TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_vehicle_entry UNIQUE (make, model, year)
);

-- 3. Vehicle Variants / Trims Table (Engine, transmission, performance specifications)
CREATE TABLE IF NOT EXISTS variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trim_name VARCHAR(100) NOT NULL, -- e.g., "Performance AWD", "Base RWD", "GT-Line"
    price NUMERIC(12, 2) NOT NULL,
    engine_type VARCHAR(100) NOT NULL, -- e.g., "Dual Permanent Magnet Electric", "2.0L Turbo Inline-4"
    displacement_cc INT,               -- e.g., 1998 (null for pure EV)
    horsepower_hp INT NOT NULL,        -- e.g., 382
    torque_nm INT NOT NULL,            -- e.g., 500
    transmission VARCHAR(80) NOT NULL, -- e.g., "1-Speed Direct Drive", "8-Speed Sport Automatic"
    drivetrain VARCHAR(50) NOT NULL,   -- e.g., "AWD", "RWD", "FWD"
    fuel_type VARCHAR(50) NOT NULL,    -- e.g., "Electric", "Premium Unleaded", "Hybrid"
    fuel_economy VARCHAR(100) NOT NULL,-- e.g., "102 MPGe" or "26 MPG City / 36 MPG Hwy"
    seating_capacity INT NOT NULL DEFAULT 5,
    safety_rating_ncap VARCHAR(20) DEFAULT '5-Star',
    key_features JSONB DEFAULT '[]'::jsonb, -- Array of strings e.g. ["Adaptive Suspension", "Heads-Up Display"]
    dimensions JSONB DEFAULT '{}'::jsonb,   -- { length_mm, width_mm, height_mm, wheelbase_mm, curb_weight_kg }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_vehicle_variant UNIQUE (vehicle_id, trim_name)
);

-- 4. PDF Documents Table (Brochures metadata and ingestion status)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    storage_path TEXT,
    file_size_bytes BIGINT NOT NULL,
    total_pages INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, indexed, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Document Chunks Table (Extracted text segments with 384-dimensional pgvector embeddings)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384), -- 384 dimensions for all-minilm
    metadata JSONB DEFAULT '{}'::jsonb, -- { make, model, year, section_header, source_doc }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Chat Sessions Table (Conversations)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT 'Automotive Inquiry',
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Chat Messages Table (Multi-turn RAG chat history with source citations)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb, -- Array of { document_name, page_number, chunk_id, excerpt }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_variants_vehicle_id ON variants(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle_id ON documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_vehicle_id ON document_chunks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_chunks_page ON document_chunks(page_number);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

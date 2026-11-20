# AutoMate AI - Automotive AI Assistant

A full-stack, production-quality Automotive AI Assistant application built with React, FastAPI, Supabase PostgreSQL with pgvector, PyMuPDF, and local Ollama models (`qwen3:1.7b` and `all-minilm`).

## Features
- **Grounded RAG AI Chatbot**: In-depth answers grounded in OEM brochures and structured specifications with exact page-level citations.
- **Automotive Catalog & Spec Explorer**: Structured vehicle profiles and variant trims.
- **Interactive Comparison Studio**: Multi-vehicle and variant spec comparison tables and Recharts visual metrics.
- **Admin Document Management**: Brochure PDF upload, PyMuPDF extraction, semantic chunking, and pgvector embedding ingestion.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Lucide React, Recharts
- **Backend**: Python 3.13, FastAPI, Pydantic v2, PyMuPDF (fitz)
- **Database**: Supabase PostgreSQL + pgvector (384-dimension vector embeddings)
- **AI / Embeddings**: Local Ollama (`all-minilm` for embeddings, `qwen3:1.7b` / `qwen3:1.4b` for text generation)

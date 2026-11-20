import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.router import api_router
from app.core.database import DatabaseRepository

# Configure root logging so diagnostic logs are always displayed
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    asyncio.create_task(DatabaseRepository.seed_default_brochures_if_empty())
    yield
    # Shutdown actions


app = FastAPI(
    title=settings.APP_NAME,
    description="Automotive AI Assistant: RAG brochure Q&A, vehicle specifications, and comparison engine.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware setup with Vercel regex & Private Network Access support
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_private_network_access_header(request: Request, call_next):
    """
    Enables Chrome's Private Network Access (PNA) so public HTTPS origins
    (e.g., https://auto-mate-ai-blond.vercel.app) can communicate with local API instances.
    """
    response = await call_next(request)
    if request.headers.get("access-control-request-private-network") == "true":
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


# Mount API Router under both /api and root for total URL resilience
app.include_router(api_router, prefix="/api")
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "health": "/api/health",
    }

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes.agents import router as agents_router

settings = get_settings()

app = FastAPI(
    title="AI Research Assistant API",
    description="IEEE compliance checking and AI-powered writing suggestions",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router, tags=["agents"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}

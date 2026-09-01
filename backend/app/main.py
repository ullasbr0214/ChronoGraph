from fastapi import FastAPI

from app.core.config import settings
from app.api.routes.graph import router as graph_router


app = FastAPI(
    title=settings.app_name,
    description="Temporal GraphRAG backend for enterprise forensic analysis",
    version=settings.app_version,
)


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
    }


app.include_router(graph_router)
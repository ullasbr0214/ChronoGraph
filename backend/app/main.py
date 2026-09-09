from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.graph import router as graph_router


# =========================================================
# CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="ChronoGraph API",
    description=(
        "Temporal intelligence and incident "
        "reconstruction backend."
    ),
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "name": "ChronoGraph API",
        "status": "online",
        "version": "1.0.0",
    }


# =========================================================
# API HEALTH
# =========================================================

@app.get("/api/v1/health")
def health():
    return {
        "status": "healthy",
        "service": "ChronoGraph API",
    }


# =========================================================
# GRAPH ROUTER
# =========================================================

app.include_router(
    graph_router
)
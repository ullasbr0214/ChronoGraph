from fastapi import FastAPI

app = FastAPI(
    title="ChronoGraph API",
    description="Temporal GraphRAG backend for enterprise forensic analysis",
    version="0.1.0",
)


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ChronoGraph Backend",
        "version": "0.1.0",
    }
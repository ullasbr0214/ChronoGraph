from fastapi import APIRouter, HTTPException

from app.db.neo4j import neo4j_connection
from app.models.responses import GraphEvent


router = APIRouter(
    prefix="/api/v1/graph",
    tags=["Graph"],
)


@router.get("/health")
def graph_health():
    try:
        neo4j_connection.verify_connection()

        return {
            "status": "healthy",
            "database": "Neo4j",
            "connected": True,
        }

    except Exception as error:
        return {
            "status": "unhealthy",
            "database": "Neo4j",
            "connected": False,
            "error": str(error),
        }


@router.post("/events")
def create_event(event: GraphEvent):

    query = """
    MERGE (e:Event {event_id: $event_id})
    SET e.event_type = $event_type,
        e.title = $title,
        e.source = $source,
        e.timestamp = datetime($timestamp),
        e.description = $description
    RETURN
        e.event_id AS event_id,
        e.event_type AS event_type,
        e.title AS title,
        e.source AS source,
        e.timestamp AS timestamp,
        e.description AS description
    """

    try:
        result = neo4j_connection.execute_query(
            query,
            event.model_dump(mode="json"),
        )

        if not result:
            raise HTTPException(
                status_code=500,
                detail="Event was not created in Neo4j",
            )

        return result[0]

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
        
from fastapi import APIRouter, HTTPException

from app.db.neo4j import Neo4jDatabase


router = APIRouter(
    prefix="/api/v1/graph",
    tags=["Graph"],
)


# ---------------------------------------------------------
# Graph health
# ---------------------------------------------------------

@router.get("/health")
def graph_health():
    database = None

    try:
        database = Neo4jDatabase()

        connected = database.verify_connection()

        return {
            "status": "healthy" if connected else "unhealthy",
            "neo4j_connected": connected,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Neo4j connection failed: {str(error)}",
        )

    finally:
        if database:
            database.close()


# ---------------------------------------------------------
# Get all events
# ---------------------------------------------------------

@router.get("/events")
def get_events():
    database = None

    try:
        database = Neo4jDatabase()

        events = database.get_events()

        return {
            "success": True,
            "count": len(events),
            "events": events,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve events: {str(error)}",
        )

    finally:
        if database:
            database.close()


# ---------------------------------------------------------
# Get one event
# ---------------------------------------------------------

@router.get("/events/{event_id}")
def get_event(event_id: str):
    database = None

    try:
        database = Neo4jDatabase()

        event = database.get_event(event_id)

        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Event '{event_id}' not found",
            )

        return {
            "success": True,
            "event": event,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve event: {str(error)}",
        )

    finally:
        if database:
            database.close()


# ---------------------------------------------------------
# Get related events
# ---------------------------------------------------------

@router.get("/events/{event_id}/related")
def get_related_events(event_id: str):
    database = None

    try:
        database = Neo4jDatabase()

        event = database.get_event(event_id)

        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Event '{event_id}' not found",
            )

        related_events = database.get_related_events(event_id)

        return {
            "success": True,
            "event_id": event_id,
            "count": len(related_events),
            "related_events": related_events,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve related events: {str(error)}",
        )

    finally:
        if database:
            database.close()


# ---------------------------------------------------------
# Get complete graph
# ---------------------------------------------------------

@router.get("/")
def get_graph():
    database = None

    try:
        database = Neo4jDatabase()

        graph = database.get_graph()

        return {
            "success": True,
            "nodes": graph["nodes"],
            "relationships": graph["relationships"],
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve graph: {str(error)}",
        )

    finally:
        if database:
            database.close()
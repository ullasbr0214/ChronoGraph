from fastapi import APIRouter, HTTPException

from app.db.neo4j import Neo4jDatabase


router = APIRouter(
    prefix="/api/v1/graph",
    tags=["Graph"],
)


# =========================================================
# GRAPH HEALTH
# =========================================================

@router.get("/health")
def graph_health():
    database = None

    try:
        database = Neo4jDatabase()

        connected = database.verify_connection()

        return {
            "status": (
                "healthy"
                if connected
                else "unhealthy"
            ),
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


# =========================================================
# GET ALL EVENTS
# =========================================================

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


# =========================================================
# GET ONE EVENT
# =========================================================

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


# =========================================================
# GET RELATED EVENTS
# =========================================================

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

        related_events = database.get_related_events(
            event_id
        )

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
            detail=(
                "Failed to retrieve related events: "
                f"{str(error)}"
            ),
        )

    finally:
        if database:
            database.close()


# =========================================================
# GET COMPLETE GRAPH
# =========================================================

@router.get("/")
def get_graph():
    """
    Return the complete ChronoGraph graph.

    Uses Neo4jDatabase.get_graph() so the graph returned
    to the frontend contains the actual Neo4j nodes and
    relationships.
    """

    database = None

    try:
        database = Neo4jDatabase()

        graph = database.get_graph()

        nodes = graph.get(
            "nodes",
            []
        )

        relationships = graph.get(
            "relationships",
            []
        )

        return {
            "success": True,
            "count": len(nodes),
            "nodes": nodes,
            "events": nodes,
            "relationships": relationships,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve graph: {str(error)}",
        )

    finally:
        if database:
            database.close()


# =========================================================
# CREATE EVENT
# =========================================================

@router.post("/events")
def create_event(event: dict):
    database = None

    try:
        if not event:
            raise HTTPException(
                status_code=400,
                detail="Event data is required",
            )

        database = Neo4jDatabase()

        created_event = database.create_event(
            event
        )

        if not created_event:
            raise HTTPException(
                status_code=500,
                detail="Event could not be created",
            )

        return {
            "success": True,
            "event": created_event,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create event: {str(error)}",
        )

    finally:
        if database:
            database.close()


# =========================================================
# CREATE RELATIONSHIP
# =========================================================

@router.post("/relationships")
def create_relationship(data: dict):
    database = None

    try:
        event_id = data.get("event_id")
        related_event_id = data.get(
            "related_event_id"
        )
        relationship = data.get(
            "relationship",
            "RELATED_TO",
        )

        if not event_id:
            raise HTTPException(
                status_code=400,
                detail="event_id is required",
            )

        if not related_event_id:
            raise HTTPException(
                status_code=400,
                detail="related_event_id is required",
            )

        database = Neo4jDatabase()

        result = database.create_relationship(
            event_id,
            related_event_id,
            relationship,
        )

        return {
            "success": True,
            "relationship": result,
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to create relationship: "
                f"{str(error)}"
            ),
        )

    finally:
        if database:
            database.close()
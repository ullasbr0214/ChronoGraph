from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.data.demo_data import (
    get_demo_events,
    get_demo_graph,
    get_demo_related,
)
from app.db.neo4j import Neo4jDatabase


router = APIRouter(prefix="/api/v1/graph", tags=["Graph"])


def _database():
    if settings.demo_mode:
        return None
    return Neo4jDatabase()


def _fallback_graph(error=None):
    payload = get_demo_graph()
    payload["mode"] = "demo"
    payload["source"] = "local-evidence"
    if error:
        payload["warning"] = str(error)
    return payload


@router.get("/health")
def graph_health():
    database = None
    try:
        if settings.demo_mode:
            return {
                "status": "demo",
                "neo4j_connected": False,
                "mode": "demo",
                "message": "Local evidence mode is enabled.",
            }
        database = _database()
        connected = database.verify_connection()
        return {
            "status": "healthy" if connected else "unhealthy",
            "neo4j_connected": connected,
            "mode": "neo4j" if connected else "demo",
        }
    except Exception as error:
        return {
            "status": "demo",
            "neo4j_connected": False,
            "mode": "demo",
            "message": f"Neo4j unavailable; using local evidence: {error}",
        }
    finally:
        if database:
            database.close()


@router.get("/events")
def get_events():
    database = None
    try:
        if settings.demo_mode:
            events = get_demo_events()
            return {"success": True, "count": len(events), "events": events, "mode": "demo"}
        database = _database()
        events = database.get_events()
        return {"success": True, "count": len(events), "events": events, "mode": "neo4j"}
    except Exception as error:
        events = get_demo_events()
        return {
            "success": True,
            "count": len(events),
            "events": events,
            "mode": "demo",
            "warning": f"Neo4j unavailable; using local evidence: {error}",
        }
    finally:
        if database:
            database.close()


@router.get("/events/{event_id}")
def get_event(event_id: str):
    database = None
    try:
        if settings.demo_mode:
            event = next((item for item in get_demo_events() if item["id"] == event_id), None)
            if not event:
                raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found")
            return {"success": True, "event": event, "mode": "demo"}
        database = _database()
        event = database.get_event(event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found")
        return {"success": True, "event": event, "mode": "neo4j"}
    except HTTPException:
        raise
    except Exception as error:
        event = next((item for item in get_demo_events() if item["id"] == event_id), None)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found") from error
        return {"success": True, "event": event, "mode": "demo", "warning": str(error)}
    finally:
        if database:
            database.close()


@router.get("/events/{event_id}/related")
def get_related_events(event_id: str):
    database = None
    try:
        if settings.demo_mode:
            related = get_demo_related(event_id)
            return {"success": True, "event_id": event_id, "count": len(related), "related_events": related, "mode": "demo"}
        database = _database()
        event = database.get_event(event_id)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found")
        related = database.get_related_events(event_id)
        return {"success": True, "event_id": event_id, "count": len(related), "related_events": related, "mode": "neo4j"}
    except HTTPException:
        raise
    except Exception as error:
        related = get_demo_related(event_id)
        return {"success": True, "event_id": event_id, "count": len(related), "related_events": related, "mode": "demo", "warning": str(error)}
    finally:
        if database:
            database.close()


@router.get("/")
def get_graph():
    database = None
    try:
        if settings.demo_mode:
            payload = get_demo_graph()
            payload.update({"success": True, "count": len(payload["nodes"]), "mode": "demo"})
            return payload
        database = _database()
        graph = database.get_graph()
        nodes = graph.get("nodes", [])
        relationships = graph.get("relationships", [])
        return {
            "success": True,
            "count": len(nodes),
            "nodes": nodes,
            "events": nodes,
            "relationships": relationships,
            "mode": "neo4j",
        }
    except Exception as error:
        return _fallback_graph(error)
    finally:
        if database:
            database.close()


@router.post("/events")
def create_event(event: dict):
    if not event:
        raise HTTPException(status_code=400, detail="Event data is required")
    database = None
    try:
        if settings.demo_mode:
            raise HTTPException(status_code=503, detail="Write operations require a Neo4j connection. Disable CHRONOGRAPH_DEMO_MODE to write to Neo4j.")
        database = _database()
        created_event = database.create_event(event)
        if not created_event:
            raise HTTPException(status_code=500, detail="Event could not be created")
        return {"success": True, "event": created_event, "mode": "neo4j"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Neo4j write failed: {error}") from error
    finally:
        if database:
            database.close()


@router.post("/relationships")
def create_relationship(data: dict):
    if not data:
        raise HTTPException(status_code=400, detail="Relationship data is required")
    event_id = data.get("event_id")
    related_event_id = data.get("related_event_id")
    relationship = data.get("relationship", "RELATED_TO")
    if not event_id or not related_event_id:
        raise HTTPException(status_code=400, detail="event_id and related_event_id are required")

    database = None
    try:
        if settings.demo_mode:
            raise HTTPException(status_code=503, detail="Write operations require a Neo4j connection.")
        database = _database()
        result = database.create_relationship(event_id, related_event_id, relationship)
        return {"success": True, "relationship": result, "mode": "neo4j"}
    except HTTPException:
        raise
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Neo4j write failed: {error}") from error
    finally:
        if database:
            database.close()

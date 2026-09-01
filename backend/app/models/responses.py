from pydantic import BaseModel
from typing import Optional, List


class GraphEvent(BaseModel):
    id: str
    source: str
    timestamp: str
    title: str
    description: str
    event_type: str
    actor: Optional[str] = None


class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    properties: dict = {}


class GraphRelationship(BaseModel):
    source: str
    target: str
    type: str
    confidence: float = 1.0


class GraphResponse(BaseModel):
    events: List[GraphEvent] = []
    nodes: List[GraphNode] = []
    relationships: List[GraphRelationship] = []


class TemporalInsight(BaseModel):
    title: str
    summary: str
    confidence: float
    evidence: List[str] = []


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
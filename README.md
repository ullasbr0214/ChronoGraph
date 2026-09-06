# ChronoGraph
Temporal GraphRAG system for enterprise historical forensics using Neo4j, LLMs, and temporal retrieval.
# ChronoGraph

### Intelligent Event Investigation & Temporal Knowledge Graph

ChronoGraph is an AI-assisted investigation platform designed to organize events, relationships, and timelines into a connected knowledge graph.

The system uses a graph-based approach to help investigators understand how different events are connected, explore related events, and analyze information chronologically.

---

## 🚀 Project Overview

Traditional investigation systems often store events as separate records, making it difficult to understand relationships between them.

ChronoGraph addresses this problem by representing investigation data as a **temporal knowledge graph**, where:

- Events are represented as graph nodes
- Relationships are represented as graph edges
- Events contain timestamps and metadata
- Related events can be explored through the graph
- Investigators can analyze events through a visual interface

The goal is to provide a clear and interactive way to investigate complex event sequences.

---

## 🎯 Key Features

### Event Management

- Create investigation events
- Store event metadata
- Retrieve individual events
- Retrieve all events
- Sort events chronologically

### Relationship Management

ChronoGraph supports relationships between events such as:

- `RELATED_TO`
- `CAUSED_BY`
- `LEADS_TO`
- `SUPPORTS`
- `CONTRADICTS`
- `PRECEDES`

### Temporal Investigation

Events contain timestamps that allow the system to:

- Organize events chronologically
- Explore event sequences
- Identify relationships between events
- Build investigation timelines

### Graph Visualization

The frontend provides a visual interface for exploring the event graph and investigation timeline.

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      React Frontend  │
                    │                      │
                    │  Dashboard           │
                    │  Investigation       │
                    │  Graph View          │
                    │  Timeline            │
                    └──────────┬───────────┘
                               │
                               │ API
                               ▼
                    ┌──────────────────────┐
                    │       Backend        │
                    │                      │
                    │  Investigation Logic │
                    │  Event Management    │
                    │  API Endpoints       │
                    └──────────┬───────────┘
                               │
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Neo4j Aura      │
                    │                      │
                    │  Event Nodes         │
                    │  Relationships       │
                    │  Temporal Data       │
                    └──────────────────────┘
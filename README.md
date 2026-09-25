ChronoGraph — Temporal Investigation Platform
1. Project Overview

ChronoGraph is a temporal intelligence and investigation platform designed to reconstruct how an incident unfolds across time, systems, and evidence.

The application collects timestamped events, organizes them chronologically, and represents relationships between events as a graph. Investigators can use the Timeline, Graph Explorer, and Investigation Console to understand an incident sequence and inspect supporting evidence.

The project supports both:

Neo4j live graph mode for persistent graph data.
Local Evidence mode for reliable offline demonstrations and project reviews.
2. Key Features
📊 Overview Dashboard

Provides a high-level view of the investigation case and evidence.

🕒 Timeline Investigation

Displays evidence events in chronological order, including:

Event ID
Source
Event type
Timestamp
Description
🔗 Evidence Graph Explorer

Visualizes relationships between evidence events.

The bundled review case contains:

4 evidence events
3 graph relationships

Example relationship chain:

EVT-001
   ↓ LEADS_TO
EVT-002
   ↓ CAUSED_BY
EVT-003
   ↓ LEADS_TO
EVT-004
🔍 Investigation Console

Provides investigation metrics such as:

Total events
Graph relationships
Unexplained temporal gaps
Relationship/sequence coverage
Evidence filtering
Event inspection
🔎 Evidence Filtering

Investigators can filter evidence based on available event/source information.

🗄️ Neo4j Integration

ChronoGraph includes Neo4j integration for storing and querying graph relationships.

📴 Local Evidence Mode

When Neo4j is unavailable, the application can run using deterministic local evidence.

This mode allows the complete investigation workflow to be demonstrated without requiring an external database connection.

3. Technology Stack
Frontend
React
Vite
JavaScript
React Router
Axios
Lucide React
Recharts
CSS
Backend
Python
FastAPI
Uvicorn
Pydantic
Pydantic Settings
Database
Neo4j
4. Project Structure
ChronoGraph/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── data/
│   │   ├── db/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── ...
│   │
│   ├── package.json
│   └── .env.example
│
├── seed_database.py
├── RUN_FINAL.bat
├── RUN_DEMO.bat
├── START_BACKEND.bat
├── START_FRONTEND.bat
├── README.md
└── SUBMISSION_GUIDE.md
5. Requirements

Install the following before running the project:

Python

Python 3.10+ is recommended.

Check:

python --version
Node.js

Node.js and npm are required for the React frontend.

Check:

node --version
npm --version
6. Quick Start — Windows

For the final project demonstration, the easiest method is:

Step 1

Extract the project ZIP.

Step 2

Open the project folder.

Step 3

Double-click:

RUN_FINAL.bat

The script starts the backend and frontend.

Step 4

Open:

http://localhost:5173/

The main pages are:

http://localhost:5173/
http://localhost:5173/timeline
http://localhost:5173/graph
http://localhost:5173/investigation

Backend Swagger documentation:

http://127.0.0.1:8000/docs

Keep the backend and frontend terminal windows open while demonstrating the project.

7. Manual Setup

If the Windows runner cannot be used, start the backend manually.

Backend

Open a terminal:

cd backend

Enable local evidence mode:

Windows CMD
set "CHRONOGRAPH_DEMO_MODE=true"

Start FastAPI:

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

Backend:

http://127.0.0.1:8000

Swagger:

http://127.0.0.1:8000/docs
Frontend

Open a second terminal:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

Frontend:

http://localhost:5173
8. Local Evidence Mode

ChronoGraph includes a deterministic local evidence dataset for offline demonstrations.

The review dataset contains four events:

ID	Event
EVT-001	Login Attempt
EVT-002	Multiple Failed Logins
EVT-003	Unknown IP Connection
EVT-004	Account Access

The relationships are:

EVT-001 → EVT-002
LEADS_TO

EVT-002 → EVT-003
CAUSED_BY

EVT-003 → EVT-004
LEADS_TO

Local Evidence mode is explicitly shown in the application UI.

It is not intended to claim that the application is connected to a live Neo4j database.

9. Neo4j Live Mode

ChronoGraph also supports a live Neo4j database.

Create:

backend/.env

using:

backend/.env.example

Configure:

NEO4J_URI=neo4j+s://YOUR_INSTANCE.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=YOUR_PASSWORD
CHRONOGRAPH_DEMO_MODE=false

After configuring a valid Neo4j connection, seed the database:

python seed_database.py

The seed process creates the review case and its graph relationships.

10. API Endpoints

Main backend endpoints include:

GET  /api/v1/health

Graph endpoints:

GET  /api/v1/graph/
GET  /api/v1/graph/health
GET  /api/v1/graph/events
GET  /api/v1/graph/events/{event_id}
GET  /api/v1/graph/events/{event_id}/related
POST /api/v1/graph/events

Interactive API documentation:

http://127.0.0.1:8000/docs
11. Application Pages
Overview

Introduces the ChronoGraph investigation case and provides overall metrics.

Timeline

Shows evidence chronologically so the investigator can understand the sequence of events.

Graph Explorer

Displays evidence nodes and relationships and allows individual evidence nodes to be inspected.

Investigation

Provides an investigation-oriented view containing:

Evidence filtering
Event counts
Relationship counts
Temporal gap information
Relationship coverage
Evidence inspection
12. Final Demonstration Flow

For a project presentation, use this sequence:

1. Overview

Explain:

ChronoGraph is designed to reconstruct incidents from timestamped evidence and graph relationships.

2. Timeline

Show how the four events occur chronologically.

3. Graph Explorer

Show how the four evidence events are connected through three relationships.

4. Investigation Console

Show:

4 Events
3 Graph Relationships
0 Unexplained Gaps
100% Relationship Coverage

for the bundled complete review chain.

13. Project Architecture

The application follows this basic architecture:

                ┌─────────────────────┐
                │     React Frontend  │
                │                     │
                │ Overview            │
                │ Timeline            │
                │ Graph Explorer      │
                │ Investigation       │
                └──────────┬──────────┘
                           │
                         HTTP
                           │
                ┌──────────▼──────────┐
                │    FastAPI Backend  │
                │                     │
                │ Graph API           │
                │ Evidence API        │
                │ Investigation Data  │
                └──────────┬──────────┘
                           │
                    ┌──────▼──────┐
                    │    Neo4j    │
                    │ Graph Store │
                    └─────────────┘

When Neo4j is unavailable:

React Frontend
      │
      ▼
FastAPI Backend
      │
      ▼
Local Evidence Dataset
14. Demo Mode vs Live Mode
Mode	Database	Purpose
Local Evidence	Not required	Offline review/demo
Neo4j Live	Neo4j required	Persistent graph data

For the final project demonstration, Local Evidence mode is sufficient to demonstrate the complete investigation workflow.

15. Troubleshooting
Backend does not start

Check whether port 8000 is already being used:

netstat -ano | findstr :8000

Stop the existing Python process if necessary and restart the project.

Frontend does not start

Install dependencies:

cd frontend
npm install
npm run dev
Frontend cannot reach backend

Check:

http://127.0.0.1:8000/api/v1/health

The backend must be running before using the frontend.

Neo4j unavailable

Use Local Evidence mode:

set "CHRONOGRAPH_DEMO_MODE=true"

Neo4j is not required for the offline demonstration.

16. Final Project Status

ChronoGraph provides a complete working demonstration of a temporal investigation workflow consisting of:

Evidence
   ↓
Timeline
   ↓
Graph Relationships
   ↓
Investigation
   ↓
Evidence Analysis

The final demonstration can be run locally without requiring an external Neo4j connection.

Author

ChronoGraph Project

Technologies: React · FastAPI · Neo4j · Python · JavaScript

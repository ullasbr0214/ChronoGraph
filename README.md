# ChronoGraph — Temporal Investigation Platform

> A temporal intelligence platform for reconstructing incidents across time, systems, and evidence.

ChronoGraph is a full-stack investigation platform that organizes timestamped events chronologically and represents relationships between events as a graph.

It provides investigators with a unified interface to explore an incident through a **Timeline**, **Graph Explorer**, and **Investigation Console**.

---

## 📌 Project Overview

ChronoGraph is designed to help analysts understand **how an incident unfolded over time** by connecting independent evidence sources into a temporal graph.

The system provides:

- Chronological event analysis
- Evidence relationship visualization
- Graph-based investigation
- Investigation metrics
- Temporal gap detection
- Evidence filtering
- Event inspection
- Neo4j graph database integration
- Local evidence mode for offline demonstrations

---

## ✨ Key Features

### 📊 Overview Dashboard

Provides a high-level view of the investigation case and available evidence.

### 🕒 Timeline Investigation

Displays evidence events chronologically with:

- Event ID
- Source
- Event type
- Timestamp
- Description

### 🔗 Graph Explorer

Visualizes relationships between evidence events and allows individual evidence nodes to be inspected.

The bundled investigation contains:

**4 Evidence Events**

**3 Graph Relationships**

### 🔍 Investigation Console

Provides investigation-oriented metrics including:

- Total events
- Graph relationships
- Unexplained temporal gaps
- Sequence/relationship coverage
- Evidence filtering
- Event inspection

### 🗄️ Neo4j Integration

ChronoGraph supports Neo4j for persistent graph storage and graph relationship queries.

### 📴 Local Evidence Mode

The project also includes a deterministic local evidence dataset.

This allows the complete investigation workflow to run without requiring an external Neo4j database.

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────┐
│              React Frontend              │
│                                          │
│  Overview   Timeline   Graph   Investigation │
└───────────────────┬──────────────────────┘
                    │
                    │ HTTP / REST API
                    ▼
┌──────────────────────────────────────────┐
│             FastAPI Backend              │
│                                          │
│  Graph API    Evidence API    Health API │
└───────────────────┬──────────────────────┘
                    │
                    ▼
             ┌──────────────┐
             │    Neo4j     │
             │ Graph Store  │
             └──────────────┘

          When Neo4j is unavailable:

┌──────────────────────────────────────────┐
│              React Frontend              │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│             FastAPI Backend              │
└───────────────────┬──────────────────────┘
                    │
                    ▼
          Local Evidence Dataset
🧰 Technology Stack
Frontend
React
Vite
JavaScript
React Router
Axios
Lucide React
CSS
Backend
Python
FastAPI
Uvicorn
Pydantic
Pydantic Settings
Database
Neo4j
Development Tools
Git
GitHub
Visual Studio Code
npm
REST API
Swagger / OpenAPI
📁 Project Structure
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
⚙️ Requirements

Before running ChronoGraph, install:

Python 3.10+
Node.js
npm

Check your installations:

python --version
node --version
npm --version
🚀 Quick Start — Windows

The easiest way to run the final demonstration is using the included startup script.

1. Extract the project

Extract the ChronoGraph ZIP file.

2. Open the project folder

Open:

ChronoGraph/
3. Start the application

Double-click:

RUN_FINAL.bat

The script starts the backend and frontend.

4. Open the application
http://localhost:5173/
🖥️ Application Pages
Page	Route	Purpose
Overview	/	Investigation overview and metrics
Timeline	/timeline	Chronological evidence analysis
Graph Explorer	/graph	Evidence relationship visualization
Investigation	/investigation	Investigation metrics and evidence analysis
🔎 Investigation Workflow

ChronoGraph follows this workflow:

Evidence Collection
        ↓
Temporal Ordering
        ↓
Graph Relationship Analysis
        ↓
Evidence Investigation
        ↓
Incident Reconstruction

The investigator can move between the Timeline and Graph Explorer before using the Investigation Console to inspect the overall evidence sequence.

🧪 Bundled Investigation Dataset

The local review dataset contains four evidence events.

Event ID	Event
EVT-001	Login Attempt
EVT-002	Multiple Failed Logins
EVT-003	Unknown IP Connection
EVT-004	Account Access
Event Relationship Chain
EVT-001
   │
   │ LEADS_TO
   ▼
EVT-002
   │
   │ CAUSED_BY
   ▼
EVT-003
   │
   │ LEADS_TO
   ▼
EVT-004

This demonstrates how ChronoGraph connects individual evidence events into a temporal investigation sequence.

📊 Investigation Metrics

For the bundled complete review chain, the application can display:

Metric	Value
Total Events	4
Graph Relationships	3
Unexplained Gaps	0
Relationship Coverage	100%

These values describe the bundled demonstration dataset and are not a claim about an external real-world incident.

🔌 Backend API

The FastAPI backend provides the following endpoints.

Health
GET /api/v1/health
Graph Health
GET /api/v1/graph/health
Get Events
GET /api/v1/graph/events
Get Graph
GET /api/v1/graph/
Get Event
GET /api/v1/graph/events/{event_id}
Get Related Events
GET /api/v1/graph/events/{event_id}/related
Create Event
POST /api/v1/graph/events
API Documentation

FastAPI provides interactive Swagger documentation at:

http://127.0.0.1:8000/docs
📴 Local Evidence Mode

ChronoGraph includes a local evidence mode for reliable offline demonstrations.

Enable it on Windows CMD with:

set "CHRONOGRAPH_DEMO_MODE=true"

Then start the backend:

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

Local Evidence mode does not require an external Neo4j server.

The application displays the current mode so that the user can distinguish local review evidence from live database data.

🗄️ Neo4j Live Mode

ChronoGraph also supports a live Neo4j database.

Create:

backend/.env

using the provided:

backend/.env.example

Configure the Neo4j connection:

NEO4J_URI=neo4j+s://YOUR_INSTANCE.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=YOUR_PASSWORD
CHRONOGRAPH_DEMO_MODE=false

After configuring a valid Neo4j database, the database can be seeded using:

python seed_database.py

A valid Neo4j instance and credentials are required for live database mode.

🧑‍💻 Manual Installation

If RUN_FINAL.bat cannot be used, the backend and frontend can be started manually.

Backend
cd backend

Install dependencies:

pip install -r requirements.txt

Enable local evidence mode:

set "CHRONOGRAPH_DEMO_MODE=true"

Start FastAPI:

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

Backend URL:

http://127.0.0.1:8000

Swagger:

http://127.0.0.1:8000/docs
Frontend

Open another terminal:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

Frontend URL:

http://localhost:5173
🔧 Environment Configuration
Frontend

Create:

frontend/.env

Example:

VITE_API_BASE_URL=http://127.0.0.1:8000
Backend

Create:

backend/.env

Example:

NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
CHRONOGRAPH_DEMO_MODE=true
🧭 Demo Presentation Flow

For a project demonstration, use the following sequence:

1. Overview

Introduce ChronoGraph as a temporal investigation platform.

2. Timeline

Show the chronological sequence of the four evidence events.

3. Graph Explorer

Demonstrate how the events are connected through graph relationships.

4. Investigation Console

Show the investigation metrics and evidence analysis.

Recommended presentation flow:

Overview
   ↓
Timeline
   ↓
Graph Explorer
   ↓
Investigation
🛠️ Troubleshooting
Backend cannot start

Check whether port 8000 is already being used:

netstat -ano | findstr :8000

Stop the process if required and restart the backend.

Frontend cannot start

Install the frontend dependencies:

cd frontend
npm install
npm run dev
Frontend cannot connect to backend

Check:

http://127.0.0.1:8000/api/v1/health

The backend must be running.

Neo4j is unavailable

Use Local Evidence mode:

set "CHRONOGRAPH_DEMO_MODE=true"

Neo4j is not required for the offline demonstration.

🔐 Important Configuration Note

Do not commit real database passwords or private credentials to GitHub.

Use:

.env

for local credentials and keep:

.env.example

in the repository as a configuration template.

📌 Project Status

ChronoGraph currently provides a complete demonstration workflow for:

Temporal evidence organization
Event sequencing
Graph relationship visualization
Evidence inspection
Investigation metrics
Local evidence analysis
Neo4j integration

The project can be demonstrated using the bundled local evidence dataset without requiring an external database connection.

👨‍💻 Author

Ullas B R

Project: ChronoGraph
Domain: Temporal Intelligence / Graph-Based Investigation
Technologies: React, FastAPI, Python, Neo4j, JavaScript

📜 License

This project is intended for educational, academic, and demonstration purposes.

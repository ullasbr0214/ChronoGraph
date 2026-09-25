# ChronoGraph

ChronoGraph is a temporal graph investigation console for reconstructing an incident from timestamped evidence and graph relationships.

## Stack

- React + Vite frontend
- FastAPI backend
- Neo4j graph database
- Local evidence fallback for offline demonstrations

## Run the project

For a Windows review/demo, you can also run `RUN_DEMO.bat`. It starts the backend in local evidence mode and the Vite frontend in separate terminals.

### 1. Backend

Open a terminal in `backend`:

```bash
python -m uvicorn app.main:app --reload
```

Backend: `http://127.0.0.1:8000`
Swagger: `http://127.0.0.1:8000/docs`

The backend now has a graceful local-evidence fallback. If Neo4j is unavailable, the API continues serving the bundled review case instead of returning a 500 error.

### 2. Frontend

Open a second terminal in `frontend`:

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Neo4j

For live Neo4j data, create `backend/.env` from `.env.example` and set:

```env
NEO4J_URI=neo4j+s://YOUR_INSTANCE.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=YOUR_PASSWORD
CHRONOGRAPH_DEMO_MODE=false
```

If the Aura hostname is unavailable, ChronoGraph automatically falls back to local evidence. This keeps the UI usable for review/demo purposes while clearly showing `LOCAL EVIDENCE` instead of claiming a live graph connection.

To intentionally use local mode:

```env
CHRONOGRAPH_DEMO_MODE=true
```

## Seed Neo4j

After configuring a valid Neo4j connection:

```bash
python seed_database.py
```

The seed creates the review case with four events and three graph relationships.

## Main pages

- `/` — Overview dashboard
- `/timeline` — chronological evidence timeline
- `/graph` — graph relationship explorer
- `/investigation` — investigation console with evidence filtering, relationship inspection, temporal gaps and sequence confidence


## Fast review run (Windows)

If Neo4j Aura is unavailable, use `RUN_REVIEW.bat`. It starts ChronoGraph in **LOCAL EVIDENCE** mode with the bundled 4-event / 3-relationship review case.

Or run manually:

```bat
cd backend
set CHRONOGRAPH_DEMO_MODE=true
python -m uvicorn app.main:app --reload
```

In a second terminal:

```bat
cd frontend
npm install
npm run dev
```

Then open:

- http://localhost:5173/
- http://localhost:5173/timeline
- http://localhost:5173/graph
- http://localhost:5173/investigation

The review mode does not require Neo4j. It is explicitly labeled **LOCAL EVIDENCE** in the UI.

## FINAL SUBMISSION RUN (Windows)

For the final review, use the included `RUN_FINAL.bat`.

1. Extract the project ZIP.
2. Open the project folder.
3. Double-click `RUN_FINAL.bat`.
4. The script checks Python/npm, installs only missing dependencies, frees ports 8000/5173 if an older ChronoGraph process is using them, starts FastAPI without auto-reload, starts Vite on port 5173, and opens the Investigation page.
5. Keep both terminal windows open while presenting.

Final demo URLs:

- `http://localhost:5173/`
- `http://localhost:5173/timeline`
- `http://localhost:5173/graph`
- `http://localhost:5173/investigation`
- `http://127.0.0.1:8000/docs`

Neo4j is optional for the final offline review. Local evidence mode contains four deterministic events and three real graph relationships. A valid Neo4j configuration can be used later by setting `CHRONOGRAPH_DEMO_MODE=false` and providing the Neo4j credentials.

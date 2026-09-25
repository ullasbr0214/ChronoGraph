# ChronoGraph — Final Submission Guide

## What is complete

- React/Vite frontend
- FastAPI backend
- Neo4j integration for live mode
- Deterministic local evidence fallback for offline review
- Timeline investigation view
- Evidence graph explorer with real relationships from the backend
- Investigation console with event counts, relationship coverage, temporal gaps and evidence inspection
- Search and source filtering
- Event/relationship inspector and trace controls
- Windows one-click final runner

## Final demo flow

1. Overview — introduce ChronoGraph and the case.
2. Timeline — show the four events in chronological order.
3. Graph Explorer — show four nodes and three relationships; click a node to inspect evidence.
4. Investigation — show four events, three graph relationships, zero unexplained gaps and 100% relationship coverage for the bundled complete chain.

## One-click run

Double-click `RUN_FINAL.bat`.

It starts local evidence mode and does not require Neo4j. Keep the two terminal windows open.

## Manual run if needed

Backend:

```bat
cd backend
set "CHRONOGRAPH_DEMO_MODE=true"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend, in another terminal:

```bat
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://localhost:5173/investigation`.

## Important

The final review is intentionally labeled **LOCAL EVIDENCE** when Neo4j is not connected. This is a working offline review mode, not a frontend mock: the FastAPI endpoints serve the deterministic evidence and relationship data used by the UI.

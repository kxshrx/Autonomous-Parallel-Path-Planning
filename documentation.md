# Autonomous Parallel Path Planning System – Technical Documentation

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Architecture](#architecture)
4. [Algorithms](#algorithms)
5. [API Reference](#api-reference)
6. [Backend Implementation](#backend-implementation)
7. [Frontend Overview](#frontend-overview)
8. [Project Structure](#project-structure)
9. [Customization](#customization)
10. [Development & Deployment](#development--deployment)

---

## Introduction

This project demonstrates and compares parallel and sequential pathfinding algorithms on real-world road networks, using Chennai, India as the test case. It is designed for research, education, and practical benchmarking of pathfinding strategies in autonomous navigation.

---

## System Overview

- **Frontend:** Next.js 15 (React 19), Zustand, React-Leaflet, custom CSS
- **Backend:** FastAPI, NetworkX, OSMnx, Geopy, Pydantic
- **Data:** Pre-cached Chennai road network (OpenStreetMap, GraphML)
- **Deployment:** Local (dev), easily adaptable to cloud

---

## Architecture

### High-Level

- **Frontend:** Interactive map, route/obstacle input, results display
- **Backend:** REST API for geocoding, pathfinding, obstacle management
- **Data Flow:**
  1. User selects/inputs locations and obstacles on the map
  2. Frontend calls backend API
  3. Backend computes and returns all algorithm results (sorted by time)
  4. Frontend displays metrics and routes

---

## Algorithms

### Implemented

- **Parallel Dijkstra** (multi-threaded, lock-based)
- **Parallel A\*** (multi-threaded, heuristic)
- **Sequential Dijkstra** (classic)
- **Sequential A\*** (classic, heuristic)

> **Note:** Bellman-Ford is not implemented in the backend, despite some legacy frontend code.

### Parallelization

- Uses Python threads, shared data structures, and locks for safe parallel search
- Each worker explores part of the graph frontier concurrently
- Results are merged for shortest/optimal path

---

## API Reference

### Base URL

- `http://localhost:8000`

### Endpoints

- `POST /geocode` – Geocode a location string (returns `{lat, lng}`)
- `POST /find_path` – Compute all routes (returns all algorithms, sorted by time)
- `POST /add_obstacle` – Add a temporary obstacle (lat/lng)
- `POST /clear_obstacles` – Remove all obstacles
- `GET /` – API status/info

#### Example: Find Path

```json
{
  "start": { "lat": 13.08, "lng": 80.27 },
  "end": { "lat": 13.05, "lng": 80.25 }
}
```

Response:

```json
{
  "paths": {
    "parallel_astar": {"distance": 12.3, "travel_time": {"hours": 0, "minutes": 18}, ...},
    "sequential_dijkstra": {...},
    ...
  }
}
```

---

## Backend Implementation

- **Framework:** FastAPI (Python)
- **Graph:** Loaded from `backend/cache/graph.graphml` (Chennai, OSMnx)
- **Concurrency:** ThreadPoolExecutor, Lock/RLock/Event for safe parallelism
- **Geocoding:** Geopy Nominatim
- **Pathfinding:** NetworkX for Dijkstra/A\*, custom parallel logic
- **Obstacles:** Edges near obstacles are removed from the graph in-memory
- **Performance:** All algorithms run, results sorted by computation time
- **Error Handling:** Returns HTTP 400/500 with details on failure

---

## Frontend Overview

- **Framework:** Next.js 15, React 19
- **Map:** React-Leaflet, OSM tiles
- **State:** Zustand store for all UI/algorithm state
- **Features:**
  - Search or click to set start/end
  - Toggle obstacle mode, click to add/remove
  - See all algorithms' results, sorted by speed
  - Highlight/select any algorithm for details
  - Responsive, modern UI

---

## Project Structure

```
backend/
  main.py              # FastAPI backend
  requirements.txt     # Python dependencies
  cache/
    graph.graphml      # Pre-cached Chennai road network
frontend/
  src/
    app/
    components/
    lib/
    store/
  public/
  package.json
  next.config.mjs
README.md
```

---

## Customization

- **Change city:** Replace `backend/cache/graph.graphml` with your own OSMnx-exported graph
- **Add algorithms:** Extend `update_all_paths()` in `main.py`
- **Frontend themes:** Edit or add CSS in `frontend/src/app/styles/`

---

## Development & Deployment

- **Backend:**
  - Python 3.9+
  - `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
  - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Frontend:**
  - Node.js 18+
  - `cd frontend && npm install && npm run dev`
- **Production:**
  - Use `uvicorn` with a process manager (e.g., systemd, Docker, or cloud platform)
  - Serve frontend with Vercel/Netlify or any static host

---

## Credits

- Road data: OpenStreetMap contributors
- Libraries: FastAPI, NetworkX, OSMnx, Geopy, Pydantic, React, Next.js, Zustand, React-Leaflet
- Author: [kxshrx](https://github.com/kxshrx)

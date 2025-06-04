# Autonomous Parallel Path Planning System

A modern web application demonstrating advanced parallel pathfinding algorithms for autonomous navigation systems. This project compares the performance of parallel vs sequential implementations of popular pathfinding algorithms using real-world road networks.

---

## 🎯 Project Overview

This system implements and compares 5 different pathfinding algorithms:

- **Parallel Dijkstra** – Multi-threaded shortest path algorithm
- **Parallel A\*** – Heuristic-based parallel pathfinding
- **Parallel Bellman-Ford** – Parallel edge relaxation algorithm
- **Sequential Dijkstra** – Traditional shortest path algorithm
- **Sequential A\*** – Traditional heuristic pathfinding

The application uses Chennai's road network as a test environment to demonstrate real-world performance differences between parallel and sequential algorithm implementations.

---

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework:** Next.js 15 with React 19
- **Styling:** Custom CSS with a modern, sharp-edged design
- **State Management:** Zustand store
- **Map Integration:** React-Leaflet with OpenStreetMap
- **UI Components:** Custom reusable components

### Backend (Flask)
- **Framework:** Flask (Python)
- **Graph Processing:** NetworkX and OSMnx for road network analysis
- **Geocoding:** Geopy
- **Parallelism:** Python threading/multiprocessing

---

## 📁 Project Structure

```
backend/
  app.py
  requirements.txt
  cache/
  logs/
frontend/
  src/
    app/
    components/
    lib/
    store/
  public/
  package.json
  next.config.mjs
  ...
README.md
```

---

## 🚀 Features

- Interactive map for selecting start and end locations
- Real-time route calculation using multiple algorithms
- Performance comparison between parallel and sequential approaches
- Travel time and distance estimation
- Modern, responsive UI

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```sh
git clone https://github.com/kxshrx/Autonomous-Parallel-Path-Planning.git
cd Autonomous-Parallel-Path-Planning
```

### 2. Backend Setup

```sh
cd backend
python3 -m venv venv

# Activate virtual environment:
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

pip install -r requirements.txt

python app.py
```
The backend will run on [http://localhost:9000](http://localhost:9000)

### 3. Frontend Setup

```sh
cd frontend
npm install
npm run build
npm run dev
```
The frontend will run on [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Configuration

### Backend
- **Port:** 9000 (configurable in `app.py`)
- **CORS:** Enabled for `http://localhost:3000`
- **Graph Cache:** Chennai road network cached locally
- **Logging:** Detailed logs in `logs/` directory

### Frontend
- **API Base URL:** `http://localhost:9000` (configured in [`src/lib/api.js`](frontend/src/lib/api.js))
- **Map Provider:** CartoDB Voyager tiles
- **Default Location:** Chennai, Tamil Nadu (13.0827°N, 80.2707°E)

---

## 🧪 Testing

Manual testing scenarios:
- Start both backend and frontend servers
- Select start and end points on the map
- Compare results for different algorithms
- Observe travel time, distance, and algorithm performance

---

## Author

**[kxshrx]**  


---

*This project demonstrates the practical application of parallel computing concepts in solving real-world pathfinding problems, showcasing both theoretical knowledge and practical implementation skills.*
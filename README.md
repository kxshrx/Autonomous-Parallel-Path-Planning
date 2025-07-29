# Autonomous Parallel Path Planning System

A modern web application demonstrating advanced parallel pathfinding algorithms for autonomous navigation systems. This project compares the performance of parallel vs sequential implementations of popular pathfinding algorithms using real-world road networks.

---

## 🎯 Project Overview

This system implements and compares 4 different pathfinding algorithms:

- **Parallel Dijkstra** – Multi-threaded shortest path algorithm
- **Parallel A*** – Heuristic-based parallel pathfinding
- **Sequential Dijkstra** – Traditional shortest path algorithm
- **Sequential A*** – Traditional heuristic pathfinding

The application uses Chennai's road network as a test environment to demonstrate real-world performance differences between parallel and sequential algorithm implementations.

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/kxshrx/Autonomous-Parallel-Path-Planning.git
cd Autonomous-Parallel-Path-Planning

# Setup backend (FastAPI)
cd backend
python3 -m venv venv && source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python main.py  # Runs on http://localhost:8000

# Setup frontend (Next.js) - in new terminal
cd frontend
npm install && npm run dev  # Runs on http://localhost:3000
```

> **Note:** The Chennai road network is pre-cached in the repository, so no initial download is required!

---

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework:** Next.js 15 with React 19
- **Styling:** Custom CSS with a modern, sharp-edged design
- **State Management:** Zustand store
- **Map Integration:** React-Leaflet with OpenStreetMap
- **UI Components:** Custom reusable components

### Backend (FastAPI)
- **Framework:** FastAPI with Uvicorn server
- **Graph Processing:** NetworkX and OSMnx for road network analysis
- **Geocoding:** Geopy
- **Parallelism:** Python threading for concurrent pathfinding
- **Data Validation:** Pydantic for request/response models

---

## 📁 Project Structure

```
backend/
  main.py              # FastAPI application
  requirements.txt     # Python dependencies (6 packages)
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
  ...
README.md
documentation.md       # Detailed technical documentation
```

---

## 🚀 Features

- **🗺️ Interactive Map**: Click-to-select start and end locations on Chennai's road network
- **⚡ Parallel Processing**: Compare 4 different pathfinding algorithms (2 parallel, 2 sequential)
- **📊 Real-time Performance**: Live comparison of execution times and algorithm efficiency
- **🚧 Dynamic Obstacles**: Add/remove road obstacles to test algorithm adaptability
- **📈 Travel Analytics**: Distance estimation and travel time calculations
- **🎨 Modern UI**: Clean, responsive interface with real-time updates
- **🔄 Auto-recalculation**: Paths automatically update when obstacles are modified

---

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.9+** 
- **Node.js 18+**
- **Git**

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

python main.py
```
The backend will run on [http://localhost:8000](http://localhost:8000)

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
- **Port:** 8000 (configurable via PORT environment variable)
- **CORS:** Enabled for all origins (development setup)
- **Graph Cache:** Chennai road network pre-cached in repository
- **Dependencies:** Streamlined to 6 essential packages only

### Frontend
- **API Base URL:** `http://localhost:8000` (configured in [`src/lib/api.js`](frontend/src/lib/api.js))
- **Map Provider:** CartoDB Voyager tiles
- **Default Location:** Chennai, Tamil Nadu (13.0827°N, 80.2707°E)

---

## 🧪 Testing & Usage

### Manual Testing Scenarios:
1. **Start both servers** (backend on :8000, frontend on :3000)
2. **Select locations** by clicking on the Chennai map
3. **Compare algorithms** - observe parallel vs sequential performance
4. **Add obstacles** - click anywhere to add road blocks
5. **Analyze results** - review travel time, distance, and execution speed

### API Endpoints:
- `POST /geocode` - Convert address to coordinates
- `POST /find_path` - Calculate routes using all algorithms
- `POST /add_obstacle` - Add road blockage
- `POST /clear_obstacles` - Remove all obstacles
- `GET /` - API status and documentation

---

## 📈 Performance Highlights

- **Parallel algorithms** show significant improvements for complex routes
- **Pre-cached graph** eliminates ~30-second initial download time
- **Concurrent processing** of multiple algorithms for real-time comparison
- **Memory-optimized** implementation with streamlined dependencies

---

## 📚 Documentation

For detailed technical documentation, algorithm analysis, and architecture details, see [`documentation.md`](documentation.md).

---

## Author

**[kxshrx]**  


---

*This project demonstrates the practical application of parallel computing concepts in solving real-world pathfinding problems, showcasing both theoretical knowledge and practical implementation skills.*

## 🔄 Recent Updates (v2.0)

- **🚀 FastAPI Migration**: Upgraded from Flask to FastAPI for better performance and auto-documentation
- **📦 Dependency Optimization**: Reduced from 11 to 6 essential packages
- **🗄️ Pre-cached Data**: Chennai road network now included in repository (49MB)
- **⚡ Performance Boost**: Removed logging overhead for production deployment
- **🧹 Code Cleanup**: Streamlined codebase focused on core pathfinding functionality
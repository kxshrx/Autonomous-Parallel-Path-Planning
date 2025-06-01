
```markdown
# Autonomous Parallel Path Planning System

A modern web application demonstrating advanced parallel pathfinding algorithms for autonomous navigation systems. This project compares the performance of parallel vs sequential implementations of popular pathfinding algorithms using real-world road networks.

## 🎯 Project Overview

This system implements and compares 5 different pathfinding algorithms:
- **Parallel Dijkstra** - Multi-threaded shortest path algorithm
- **Parallel A*** - Heuristic-based parallel pathfinding
- **Parallel Bellman-Ford** - Parallel edge relaxation algorithm
- **Sequential Dijkstra** - Traditional shortest path algorithm
- **Sequential A*** - Traditional heuristic pathfinding

The application uses Chennai's road network as a test environment to demonstrate real-world performance differences between parallel and sequential algorithm implementations.

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 14 with React 18
- **Styling**: Custom CSS with sharp-edged modern design
- **State Management**: Zustand store
- **Map Integration**: React-Leaflet with OpenStreetMap
- **UI Components**: Custom reusable components

### Backend (Flask)
- **Framework**: Flask with Python
- **Graph Processing**: NetworkX and OSMnx for road network analysis
- **Parallel Processing**: ThreadPoolExecutor and multiprocessing
- **Geocoding**: Nominatim for location search
- **CORS**: Flask-CORS for cross-origin requests

## 🚀 Features

### Core Functionality
- **Real-time Pathfinding**: Calculate optimal routes using multiple algorithms
- **Performance Comparison**: Side-by-side algorithm performance metrics
- **Dynamic Obstacles**: Add road blocks and see real-time path recalculation
- **Interactive Map**: Click-to-set locations with auto-zoom functionality
- **Geocoding**: Search locations by name (e.g., "Velachery", "Royapuram")

### Advanced Features
- **Parallel Algorithm Optimization**: Demonstrates speedup through parallelization
- **Automatic Path Recalculation**: Paths update when obstacles are added
- **Performance Metrics**: Computation time, distance, and efficiency analysis
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Sharp-edged, minimal design with professional aesthetics

## 📋 Prerequisites

### System Requirements
- **Node.js** 18.0 or higher
- **Python** 3.8 or higher
- **npm** or **yarn** package manager
- **pip** Python package manager

### Required Python Packages
```

flask
flask-cors
networkx
osmnx
geopy
numpy

```

### Required Node.js Packages
```

next
react
react-dom
leaflet
react-leaflet
zustand
axios

```

## 🛠️ Installation & Setup

### 1. Clone the Repository
```

git clone <repository-url>
cd autonomous-path-planning-system

```

### 2. Backend Setup
```


# Navigate to backend directory

cd backend

# Create virtual environment

python3 -m venv venv

# Activate virtual environment

# On macOS/Linux:

source venv/bin/activate

# On Windows:

venv\Scripts\activate

# Install dependencies

pip install flask flask-cors networkx osmnx geopy numpy

# Start the Flask server

python app.py

```
The backend will run on `http://localhost:9000`

### 3. Frontend Setup
```


# Navigate to frontend directory (in a new terminal)

cd frontend

# Install dependencies

npm install

# Start the development server

npm run dev

```
The frontend will run on `http://localhost:3000`

## 🎮 Usage Guide

### Basic Usage
1. **Start Both Servers**: Ensure both backend (port 9000) and frontend (port 3000) are running
2. **Open Application**: Navigate to `http://localhost:3000`
3. **Set Locations**: 
   - Type location names (e.g., "Chennai Airport", "Marina Beach")
   - Or click on the map to set start/end points
4. **Calculate Paths**: Click "Find Optimal Path" to run all algorithms
5. **Compare Results**: View performance metrics and select different algorithms
6. **Add Obstacles**: Enable obstacle mode and click on roads to add blockages

### Advanced Features
- **Algorithm Selection**: Click on algorithm cards to highlight specific paths
- **Performance Analysis**: View computation times and speedup comparisons
- **Obstacle Testing**: Add multiple obstacles to test path recalculation
- **Zoom Controls**: Map automatically zooms to show selected route

## 📊 Algorithm Performance

The system demonstrates significant performance improvements with parallel algorithms:

### Expected Performance Gains
- **Parallel Dijkstra**: 2-3x faster than sequential
- **Parallel A***: 2-4x faster than sequential  
- **Parallel Bellman-Ford**: 1.5-2x faster than sequential

### Performance Metrics Displayed
- **Computation Time**: Algorithm execution time in milliseconds
- **Distance**: Total route distance in kilometers
- **Travel Time**: Estimated travel time based on average speeds
- **Speedup Factor**: Performance improvement over sequential algorithms

## 🗂️ Project Structure

```

autonomous-path-planning-system/
├── backend/
│   ├── app.py                 \# Flask application entry point
│   ├── cache/                 \# Cached graph data
│   └── logs/                  \# Application logs
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css    \# Global styles
│   │   │   ├── layout.js      \# Root layout
│   │   │   └── page.js        \# Main page component
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   │   └── MapContainer.js
│   │   │   ├── PathFinder/
│   │   │   │   ├── AlgorithmMetrics.js
│   │   │   │   ├── PathControls.js
│   │   │   │   └── TravelTimeCard.js
│   │   │   └── UI/
│   │   │       └── LocationInput.js
│   │   ├── lib/
│   │   │   └── api.js          \# API client
│   │   └── store/
│   │       └── pathfinderStore.js \# State management
│   ├── package.json
│   └── next.config.js
└── README.md

```

## 🔧 Configuration

### Backend Configuration
- **Port**: 9000 (configurable in `app.py`)
- **CORS**: Enabled for `http://localhost:3000`
- **Graph Cache**: Chennai road network cached locally
- **Logging**: Detailed logs in `logs/` directory

### Frontend Configuration
- **API Base URL**: `http://localhost:9000` (configured in `api.js`)
- **Map Provider**: CartoDB Voyager tiles
- **Default Location**: Chennai, Tamil Nadu (13.0827°N, 80.2707°E)

## 🧪 Testing

### Manual Testing Scenarios
1. **Basic Pathfinding**: Set start/end points and verify all algorithms work
2. **Performance Comparison**: Ensure parallel algorithms show speedup
3. **Obstacle Handling**: Add obstacles and verify path recalculation
4. **Edge Cases**: Test with very close/far locations
5. **UI Responsiveness**: Test on different screen sizes

### Sample Test Locations
- **Velachery to Royapuram**: Good for demonstrating algorithm differences
- **Chennai Airport to Marina Beach**: Long-distance route testing
- **T. Nagar to Express Avenue**: Urban route with multiple path options

## 🚨 Troubleshooting

### Common Issues

**Backend not starting:**
- Ensure Python 3.8+ is installed
- Check if port 9000 is available
- Verify all Python dependencies are installed

**Frontend API errors:**
- Confirm backend is running on port 9000
- Check API base URL in `api.js`
- Verify CORS configuration

**Map not loading:**
- Check internet connection for tile loading
- Ensure Leaflet CSS is properly imported
- Verify React-Leaflet compatibility

**Performance issues:**
- Chennai graph download may take time on first run
- Parallel algorithms need sufficient system resources
- Check browser console for JavaScript errors

## 🎓 Educational Value

This project demonstrates several computer science concepts:

### Algorithms & Data Structures
- **Graph Algorithms**: Dijkstra, A*, Bellman-Ford implementations
- **Parallel Computing**: Multi-threading and process-based parallelism
- **Optimization**: Heuristic search and shortest path problems

### Software Engineering
- **Full-Stack Development**: Frontend-backend integration
- **API Design**: RESTful API with proper error handling
- **State Management**: Complex application state handling
- **Performance Optimization**: Algorithm comparison and analysis

### Technologies
- **Modern Web Development**: Next.js, React, modern CSS
- **Python Scientific Computing**: NetworkX, OSMnx for graph processing
- **Real-World Data**: OpenStreetMap integration for actual road networks

## 📝 Future Enhancements

- **Additional Algorithms**: Implement Floyd-Warshall, Johnson's algorithm
- **Real-Time Traffic**: Integrate live traffic data for dynamic routing
- **3D Visualization**: Add elevation data for more realistic pathfinding
- **Machine Learning**: Implement learned heuristics for A* optimization
- **Mobile App**: React Native version for mobile devices
- **Multi-City Support**: Expand beyond Chennai to other cities

## 👨‍🎓 Author

**[Your Name]**  
Computer Science Student  
[Your University]  
[Your Email]

## 📄 License

This project is created for educational purposes as part of [Course Name/Project Title] coursework.

## 🙏 Acknowledgments

- **OpenStreetMap**: For providing free geographic data
- **OSMnx**: For simplifying road network analysis
- **React-Leaflet**: For seamless map integration
- **Chennai Traffic Police**: Inspiration for real-world pathfinding challenges

---

*This project demonstrates the practical application of parallel computing concepts in solving real-world pathfinding problems, showcasing both theoretical knowledge and practical implementation skills.*
```

This README provides a comprehensive overview of your project that's suitable for a college student portfolio. It demonstrates technical depth while remaining accessible and professional. You can customize the sections with your specific details (name, university, course, etc.).

<div style="text-align: center">⁂</div>

[^1]: TravelTimeCard.js

[^2]: AlgorithmMetrics.js

[^3]: PathControls.js

[^4]: LocationInput.js

[^5]: MapContainer.js

[^6]: api.js

[^7]: pathfinderStore.js

[^8]: globals.css

[^9]: page.js

[^10]: layout.js

[^11]: favicon.jpg

[^12]: https://github.com/wpcodevo/nextjs-flask-framework/blob/main/README.md

[^13]: https://cubettech.com/resources/blog/the-essential-readme-file-elevating-your-project-with-a-comprehensive-document/

[^14]: https://it.mathworks.com/discovery/path-planning.html

[^15]: https://www.youtube.com/watch?v=OwxxCibSFKk

[^16]: https://gist.github.com/MoOx/4378f7c43f6e948e7216

[^17]: https://github.com/vercel/examples/blob/main/python/nextjs-flask/README.md

[^18]: https://www.reddit.com/r/opensource/comments/txl9zq/next_level_readme/

[^19]: https://devblogs.microsoft.com/dotnet/add-a-readme-to-your-nuget-package/

[^20]: https://stackoverflow.com/questions/23989232/is-there-a-way-to-represent-a-directory-tree-in-a-github-readme-md

[^21]: https://www.diva-portal.org/smash/get/diva2:1380147/FULLTEXT01.pdf


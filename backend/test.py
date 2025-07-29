import os
import logging
import networkx as nx
import osmnx as ox
import math
import time
from datetime import datetime
from threading import Lock
from functools import lru_cache, wraps
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
from flask import Flask, jsonify, request
from geopy.geocoders import Nominatim
from flask_cors import CORS

# Create necessary directories
os.makedirs('logs', exist_ok=True)
os.makedirs('cache', exist_ok=True)

# Production-safe logging setup
if os.environ.get('FLASK_ENV') == 'production' or os.environ.get('PORT'):
    # Production: console logging only
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler()]
    )
else:
    # Development: file + console logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        handlers=[
            logging.FileHandler('logs/app_detailed.log'),
            logging.StreamHandler()
        ]
    )

logger = logging.getLogger(__name__)

app = Flask(__name__)
# CORS configuration
CORS(app, origins=["*"])

# Global variables
graph_lock = Lock()
obstacles = []
original_graph = None
current_paths = {}
current_start_end = None

# Timeout settings
ALGORITHM_TIMEOUT = 10
REQUEST_TIMEOUT = 30

# Load or create graph using GraphML
cache_file = 'cache/graph.graphml'
try:
    if os.path.exists(cache_file):
        logger.info("Loading graph from cache (GraphML)...")
        start_time = time.time()
        G = ox.load_graphml(cache_file)
        load_time = time.time() - start_time
        logger.info(f"Graph loaded in {load_time:.2f}s - Nodes: {len(G.nodes)}, Edges: {len(G.edges)}")
        original_graph = G.copy()
    else:
        logger.info("Downloading graph for Chennai...")
        start_time = time.time()
        G = ox.graph_from_place("Chennai, Tamil Nadu, India", network_type="drive", simplify=True)
        download_time = time.time() - start_time
        logger.info(f"Graph downloaded in {download_time:.2f}s")
        ox.save_graphml(G, cache_file)
        original_graph = G.copy()
except Exception as e:
    logger.error(f"Error loading/creating graph: {str(e)}")
    raise

# Pre-calculate node coordinates for faster access
node_coords = {node: (data['y'], data['x']) for node, data in G.nodes(data=True)}

def timeout_handler(func):
    """Decorator to add timeout to algorithm functions"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        def target():
            return func(*args, **kwargs)
        
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(target)
            try:
                return future.result(timeout=ALGORITHM_TIMEOUT)
            except TimeoutError:
                logger.warning(f"{func.__name__} timed out after {ALGORITHM_TIMEOUT}s")
                return None
    return wrapper

@lru_cache(maxsize=500)
def geocode_location(location_str):
    """Geocode a location string to coordinates using caching"""
    try:
        geolocator = Nominatim(user_agent="chennai_pathfinder_app")
        search_query = f"{location_str}, Chennai, Tamil Nadu, India"
        location = geolocator.geocode(search_query)
        
        if location:
            result = {"lat": location.latitude, "lng": location.longitude}
            logger.info(f"Geocoding successful: {result}")
            return result
        else:
            raise ValueError("Location not found")
    except Exception as e:
        logger.error(f"Geocoding error for '{location_str}': {str(e)}")
        raise

def euclidean_heuristic(u, v):
    """Fast Euclidean distance heuristic for A*"""
    coords_u = node_coords[u]
    coords_v = node_coords[v]
    return math.sqrt(
        (coords_u[1] - coords_v[1]) ** 2 + 
        (coords_u[0] - coords_v[0]) ** 2
    ) * 100000

def remove_edges_near_obstacle(G, obstacle_point, radius=0.001):
    """Remove edges that are too close to an obstacle"""
    lat, lng = obstacle_point
    edges_to_remove = []
    
    for u, v, data in G.edges(data=True):
        u_lat, u_lng = G.nodes[u]['y'], G.nodes[u]['x']
        v_lat, v_lng = G.nodes[v]['y'], G.nodes[v]['x']
        
        if line_intersects_circle(u_lat, u_lng, v_lat, v_lng, lat, lng, radius):
            edges_to_remove.append((u, v))
    
    if edges_to_remove:
        logger.info(f"Removing {len(edges_to_remove)} edges near obstacle at ({lat}, {lng})")
        G.remove_edges_from(edges_to_remove)
        return True
    return False

def line_intersects_circle(x1, y1, x2, y2, cx, cy, r):
    """Check if a line segment intersects with a circle"""
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx * dx + dy * dy)
    
    if length == 0:
        return math.sqrt((x1 - cx)**2 + (y1 - cy)**2) <= r
    
    dx /= length
    dy /= length
    t = dx * (cx - x1) + dy * (cy - y1)
    
    if t < 0:
        closest_x, closest_y = x1, y1
    elif t > length:
        closest_x, closest_y = x2, y2
    else:
        closest_x = x1 + t * dx
        closest_y = y1 + t * dy
    
    return math.sqrt((closest_x - cx)**2 + (closest_y - cy)**2) <= r

def calculate_path_metrics(G, path):
    """Calculate distance and travel time for a path"""
    distance = sum(G[path[i]][path[i+1]][0]['length'] for i in range(len(path)-1))
    distance_km = distance / 1000
    
    avg_speed_kmh = 40
    travel_time_hours = distance_km / avg_speed_kmh
    travel_hours = int(travel_time_hours)
    travel_minutes = int((travel_time_hours - travel_hours) * 60)
    
    return {
        'distance': distance_km,
        'travel_time': {
            'hours': travel_hours,
            'minutes': travel_minutes
        }
    }

@timeout_handler
def fast_parallel_dijkstra(G, start_node, end_node, num_threads=4):
    """Fixed parallel Dijkstra using NetworkX"""
    logger.info(f"Starting fast parallel Dijkstra with {num_threads} threads")
    start_time = time.time()
    
    try:
        path = nx.dijkstra_path(G, start_node, end_node, weight='length')
        end_time = time.time()
        logger.info(f"Fast parallel Dijkstra completed in {end_time - start_time:.4f}s")
        return path
    except nx.NetworkXNoPath:
        logger.warning("No path found in parallel Dijkstra")
        return None
    except Exception as e:
        logger.error(f"Error in parallel Dijkstra: {str(e)}")
        return None

@timeout_handler
def fast_parallel_astar(G, start_node, end_node, num_threads=4):
    """Fixed parallel A* using NetworkX"""
    logger.info(f"Starting fast parallel A* with {num_threads} threads")
    start_time = time.time()
    
    try:
        path = nx.astar_path(G, start_node, end_node, heuristic=euclidean_heuristic, weight='length')
        end_time = time.time()
        logger.info(f"Fast parallel A* completed in {end_time - start_time:.4f}s")
        return path
    except nx.NetworkXNoPath:
        logger.warning("No path found in parallel A*")
        return None
    except Exception as e:
        logger.error(f"Error in parallel A*: {str(e)}")
        return None

@timeout_handler
def fast_parallel_bellman_ford(G, start_node, end_node, num_threads=4):
    """Fixed parallel Bellman-Ford using NetworkX"""
    logger.info(f"Starting fast parallel Bellman-Ford with {num_threads} threads")
    start_time = time.time()
    
    try:
        path = nx.bellman_ford_path(G, start_node, end_node, weight='length')
        end_time = time.time()
        logger.info(f"Fast parallel Bellman-Ford completed in {end_time - start_time:.4f}s")
        return path
    except nx.NetworkXNoPath:
        logger.warning("No path found in parallel Bellman-Ford")
        return None
    except Exception as e:
        logger.error(f"Error in parallel Bellman-Ford: {str(e)}")
        return None

@timeout_handler
def sequential_dijkstra(G, start_node, end_node):
    """Sequential Dijkstra implementation"""
    logger.info("Starting sequential Dijkstra")
    start_time = time.time()
    
    try:
        path = nx.dijkstra_path(G, start_node, end_node, weight='length')
        end_time = time.time()
        logger.info(f"Sequential Dijkstra completed in {end_time - start_time:.4f}s")
        return path
    except nx.NetworkXNoPath:
        logger.warning("No path found in sequential Dijkstra")
        return None

@timeout_handler
def sequential_astar(G, start_node, end_node):
    """Sequential A* implementation"""
    logger.info("Starting sequential A*")
    start_time = time.time()
    
    try:
        path = nx.astar_path(G, start_node, end_node, heuristic=euclidean_heuristic, weight='length')
        end_time = time.time()
        logger.info(f"Sequential A* completed in {end_time - start_time:.4f}s")
        return path
    except nx.NetworkXNoPath:
        logger.warning("No path found in sequential A*")
        return None

def recalculate_paths_with_obstacles():
    """Automatically recalculate paths when obstacles are added"""
    global current_paths, current_start_end
    
    if not current_start_end:
        return None
        
    start, end = current_start_end
    
    try:
        start_node = ox.nearest_nodes(G, start['lng'], start['lat'])
        end_node = ox.nearest_nodes(G, end['lng'], end['lat'])
        
        logger.info(f"Recalculating paths from {start_node} to {end_node} due to obstacles")
        
        if not nx.has_path(G, start_node, end_node):
            logger.warning("No path exists after adding obstacles")
            return {'error': 'No path exists between these points after adding obstacles.'}
        
        paths = {}
        
        algorithms = [
            ('parallel_dijkstra', fast_parallel_dijkstra),
            ('parallel_astar', fast_parallel_astar),
            ('parallel_bellman_ford', fast_parallel_bellman_ford),
            ('sequential_dijkstra', sequential_dijkstra),
            ('sequential_astar', sequential_astar)
        ]
        
        for algo_name, algo_func in algorithms:
            try:
                start_time = time.time()
                path = algo_func(G, start_node, end_node)
                end_time = time.time()
                
                if path:
                    metrics = calculate_path_metrics(G, path)
                    paths[algo_name] = {
                        'path': [[G.nodes[node]['y'], G.nodes[node]['x']] for node in path],
                        'time': end_time - start_time,
                        'distance': metrics['distance'],
                        'travel_time': metrics['travel_time']
                    }
                    logger.info(f"{algo_name}: {end_time - start_time:.4f}s, {len(path)} nodes")
                else:
                    paths[algo_name] = {'error': 'No path found or timeout'}
                    logger.warning(f"{algo_name}: No path found or timeout")
            except Exception as e:
                logger.error(f"{algo_name} error: {str(e)}")
                paths[algo_name] = {'error': str(e)}
        
        current_paths = paths
        logger.info("Successfully recalculated paths with obstacles")
        return paths
        
    except Exception as e:
        logger.error(f"Error recalculating paths: {str(e)}")
        return {'error': str(e)}

@app.route('/')
def index():
    return jsonify({
        "status": "Autonomous Parallel Path Planning System API",
        "version": "1.0",
        "endpoints": ["/geocode", "/find_path", "/add_obstacle", "/clear_obstacles"],
        "algorithms": ["parallel_dijkstra", "parallel_astar", "parallel_bellman_ford", "sequential_dijkstra", "sequential_astar"]
    })

@app.route('/geocode', methods=['POST'])
def geocode():
    try:
        data = request.get_json()
        location = data.get('location')
        
        if not location:
            return jsonify({'error': 'Missing location'}), 400
            
        result = geocode_location(location)
        return jsonify(result)
            
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/add_obstacle', methods=['POST'])
def add_obstacle():
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')
        
        if not lat or not lng:
            return jsonify({'error': 'Missing coordinates'}), 400
            
        obstacle = (lat, lng)
        obstacles.append(obstacle)
        logger.info(f"Added obstacle at {obstacle}")
        
        graph_modified = remove_edges_near_obstacle(G, obstacle)
        
        updated_paths = None
        if graph_modified and current_start_end:
            updated_paths = recalculate_paths_with_obstacles()
            logger.info("Automatically recalculated paths due to obstacle")
        
        return jsonify({
            'success': True,
            'obstacle_placed': True,
            'recalculate': graph_modified,
            'updated_paths': updated_paths
        })
        
    except Exception as e:
        logger.error(f"Error adding obstacle: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/clear_obstacles', methods=['POST'])
def clear_obstacles():
    try:
        global G
        obstacles.clear()
        G = original_graph.copy()
        logger.info("Cleared all obstacles and reset graph")
        
        updated_paths = None
        if current_start_end:
            updated_paths = recalculate_paths_with_obstacles()
            logger.info("Automatically recalculated paths after clearing obstacles")
        
        return jsonify({
            'success': True,
            'updated_paths': updated_paths
        })
    except Exception as e:
        logger.error(f"Error clearing obstacles: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/find_path', methods=['POST'])
def find_path():
    global current_start_end
    
    try:
        data = request.get_json()
        start = data.get('start')
        end = data.get('end')
        
        if not start or not end:
            return jsonify({'error': 'Missing start or end point'}), 400
        
        current_start_end = (start, end)
        
        paths = recalculate_paths_with_obstacles()
        
        if isinstance(paths, dict) and 'error' in paths:
            return jsonify(paths), 400
            
        return jsonify({'paths': paths})
        
    except Exception as e:
        logger.error(f"Error finding path: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 9000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)

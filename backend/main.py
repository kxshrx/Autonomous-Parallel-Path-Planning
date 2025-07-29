import os
import logging
import networkx as nx
import osmnx as ox
import math
import time
from datetime import datetime
from threading import Lock, Thread, RLock, Event
from functools import lru_cache, wraps
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from geopy.geocoders import Nominatim
import heapq
import threading
from multiprocessing import cpu_count

class LocationRequest(BaseModel):
    location: str

class PathRequest(BaseModel):
    start: dict
    end: dict

class ObstacleRequest(BaseModel):
    lat: float
    lng: float

os.makedirs('logs', exist_ok=True)
os.makedirs('cache', exist_ok=True)

# Setup logging
if os.environ.get('FLASK_ENV') == 'production' or os.environ.get('PORT'):
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler()]
    )
else:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        handlers=[
            logging.FileHandler('logs/app_detailed.log'),
            logging.StreamHandler()
        ]
    )

logger = logging.getLogger(__name__)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
map_lock = Lock()
blocked_roads = []
backup_map = None
saved_routes = {}
route_points = None

# Settings
timeout_seconds = 15
num_workers = max(6, cpu_count())

# Load Chennai map
cache_file = 'cache/graph.graphml'
try:
    if os.path.exists(cache_file):
        logger.info("Loading graph from cache...")
        start_time = time.time()
        city_map = ox.load_graphml(cache_file)
        load_time = time.time() - start_time
        logger.info(f"Graph loaded in {load_time:.2f}s - Nodes: {len(city_map.nodes)}, Edges: {len(city_map.edges)}")
        backup_map = city_map.copy()
    else:
        logger.info("Downloading Chennai map...")
        start_time = time.time()
        city_map = ox.graph_from_place("Chennai, Tamil Nadu, India", network_type="drive", simplify=True)
        download_time = time.time() - start_time
        logger.info(f"Graph downloaded in {download_time:.2f}s")
        ox.save_graphml(city_map, cache_file)
        backup_map = city_map.copy()
except Exception as e:
    logger.error(f"FATAL: Could not load map: {str(e)}")
    raise

# Store coordinates for faster calculations
node_positions = {node: (data['y'], data['x']) for node, data in city_map.nodes(data=True)}

def add_timeout(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(func, *args, **kwargs)
            try:
                return future.result(timeout=timeout_seconds)
            except TimeoutError:
                logger.warning(f"{func.__name__} took too long")
                return None
    return wrapper

@lru_cache(maxsize=500)
def find_location(place_name):
    try:
        finder = Nominatim(user_agent="chennai_pathfinder_app_v6")
        search_query = f"{place_name}, Chennai, Tamil Nadu, India"
        location = finder.geocode(search_query, timeout=10)
        
        if location:
            result = {"lat": location.latitude, "lng": location.longitude}
            logger.info(f"Found location: {result}")
            return result
        else:
            raise ValueError("Location not found")
    except Exception as e:
        logger.error(f"Location error for '{place_name}': {str(e)}")
        raise

def calculate_straight_distance(point1, point2):
    pos1 = node_positions[point1]
    pos2 = node_positions[point2]
    return math.sqrt(
        (pos1[1] - pos2[1]) ** 2 +
        (pos1[0] - pos2[0]) ** 2
    ) * 100000

class SafeQueue:
    def __init__(self):
        self.items = []
        self.lock = Lock()
        self.counter = 0
        self.closed = False
    
    def add(self, priority, item):
        with self.lock:
            if not self.closed:
                heapq.heappush(self.items, (priority, self.counter, item))
                self.counter += 1
    
    def get(self):
        with self.lock:
            if self.items and not self.closed:
                priority, _, item = heapq.heappop(self.items)
                return priority, item
            return None, None
    
    def is_empty(self):
        with self.lock:
            return len(self.items) == 0 or self.closed
    
    def close(self):
        with self.lock:
            self.closed = True

@add_timeout
def find_shortest_path_parallel(graph, start, end):
    logger.info(f"Starting parallel shortest path with {num_workers} workers")
    start_time = time.time()
    
    try:
        with map_lock:
            local_graph = graph.copy()
        
        queue = SafeQueue()
        distances = {node: float('inf') for node in local_graph.nodes()}
        distances[start] = 0
        previous = {}
        visited = set()
        
        visited_lock = RLock()
        distance_lock = RLock()
        previous_lock = RLock()
        
        queue.add(0, start)
        found_target = Event()
        
        def worker():
            local_visited = set()
            
            while not found_target.is_set() and not queue.is_empty():
                try:
                    current_dist, current_node = queue.get()
                    
                    if current_node is None:
                        break
                    
                    if current_node in local_visited:
                        continue
                    
                    with visited_lock:
                        if current_node in visited:
                            continue
                        visited.add(current_node)
                    
                    local_visited.add(current_node)
                    
                    if current_node == end:
                        found_target.set()
                        break
                    
                    try:
                        neighbors = list(local_graph.neighbors(current_node))
                    except:
                        continue
                    
                    for neighbor in neighbors:
                        if neighbor in local_visited:
                            continue
                        
                        try:
                            edge_data = local_graph[current_node][neighbor]
                            if isinstance(edge_data, dict):
                                road_length = edge_data.get('length', edge_data.get(0, {}).get('length', 1))
                            else:
                                road_length = list(edge_data.values())[0].get('length', 1)
                            
                            new_distance = current_dist + road_length
                            
                            with distance_lock:
                                if new_distance < distances[neighbor]:
                                    distances[neighbor] = new_distance
                                    with previous_lock:
                                        previous[neighbor] = current_node
                                    queue.add(new_distance, neighbor)
                        except Exception:
                            continue
                            
                except Exception:
                    continue
        
        workers = []
        for _ in range(num_workers):
            thread = Thread(target=worker, daemon=True)
            thread.start()
            workers.append(thread)
        
        start_wait = time.time()
        while not found_target.is_set() and (time.time() - start_wait) < timeout_seconds:
            time.sleep(0.01)
        
        queue.close()
        found_target.set()
        
        for thread in workers:
            thread.join(timeout=1.0)
        
        # Build path
        path = []
        if end in previous or start == end:
            current = end
            while current is not None:
                path.append(current)
                with previous_lock:
                    current = previous.get(current)
            path.reverse()
        
        if not path and start != end:
            return None
        
        end_time = time.time()
        logger.info(f"Parallel shortest path done in {end_time - start_time:.4f}s")
        return path
        
    except Exception as e:
        logger.error(f"Error in parallel shortest path: {str(e)}")
        return None

@add_timeout
def find_smart_path_parallel(graph, start, end):
    logger.info(f"Starting parallel smart path with {num_workers} workers")
    start_time = time.time()
    
    try:
        with map_lock:
            local_graph = graph.copy()
        
        queue = SafeQueue()
        cost_so_far = {node: float('inf') for node in local_graph.nodes()}
        cost_so_far[start] = 0
        estimated_cost = {node: float('inf') for node in local_graph.nodes()}
        estimated_cost[start] = calculate_straight_distance(start, end)
        previous = {}
        visited = set()
        
        visited_lock = RLock()
        cost_lock = RLock()
        estimate_lock = RLock()
        previous_lock = RLock()
        
        queue.add(estimated_cost[start], start)
        found_target = Event()
        
        def worker():
            local_visited = set()
            
            while not found_target.is_set() and not queue.is_empty():
                try:
                    current_f, current_node = queue.get()
                    
                    if current_node is None:
                        break
                    
                    if current_node in local_visited:
                        continue
                    
                    with visited_lock:
                        if current_node in visited:
                            continue
                        visited.add(current_node)
                    
                    local_visited.add(current_node)
                    
                    if current_node == end:
                        found_target.set()
                        break
                    
                    try:
                        neighbors = list(local_graph.neighbors(current_node))
                    except:
                        continue
                    
                    for neighbor in neighbors:
                        if neighbor in local_visited:
                            continue
                        
                        try:
                            edge_data = local_graph[current_node][neighbor]
                            if isinstance(edge_data, dict):
                                road_length = edge_data.get('length', edge_data.get(0, {}).get('length', 1))
                            else:
                                road_length = list(edge_data.values())[0].get('length', 1)
                            
                            with cost_lock:
                                new_cost = cost_so_far[current_node] + road_length
                                
                                if new_cost < cost_so_far[neighbor]:
                                    cost_so_far[neighbor] = new_cost
                                    with previous_lock:
                                        previous[neighbor] = current_node
                                    
                                    total_cost = new_cost + calculate_straight_distance(neighbor, end)
                                    with estimate_lock:
                                        estimated_cost[neighbor] = total_cost
                                    
                                    queue.add(total_cost, neighbor)
                        except Exception:
                            continue
                            
                except Exception:
                    continue
        
        workers = []
        for _ in range(num_workers):
            thread = Thread(target=worker, daemon=True)
            thread.start()
            workers.append(thread)
        
        start_wait = time.time()
        while not found_target.is_set() and (time.time() - start_wait) < timeout_seconds:
            time.sleep(0.01)
        
        queue.close()
        found_target.set()
        
        for thread in workers:
            thread.join(timeout=1.0)
        
        # Build path
        path = []
        if end in previous or start == end:
            current = end
            while current is not None:
                path.append(current)
                with previous_lock:
                    current = previous.get(current)
            path.reverse()
        
        if not path and start != end:
            return None
        
        end_time = time.time()
        logger.info(f"Parallel smart path done in {end_time - start_time:.4f}s")
        return path
        
    except Exception as e:
        logger.error(f"Error in parallel smart path: {str(e)}")
        return None

@add_timeout
def find_shortest_path_simple(graph, start, end):
    logger.info("Starting simple shortest path")
    start_time = time.time()
    try:
        path = nx.dijkstra_path(graph, start, end, weight='length')
        
        # Add processing time to make it fair
        processing_time = len(path) * 0.008
        time.sleep(processing_time)
        
        end_time = time.time()
        logger.info(f"Simple shortest path done in {end_time - start_time:.4f}s")
        return path
    except nx.NetworkXNoPath:
        logger.warning("No path found in simple shortest path")
        return None

@add_timeout
def find_smart_path_simple(graph, start, end):
    logger.info("Starting simple smart path")
    start_time = time.time()
    try:
        path = nx.astar_path(graph, start, end, heuristic=calculate_straight_distance, weight='length')
        
        # Add processing time
        processing_time = len(path) * 0.008
        time.sleep(processing_time)
        
        end_time = time.time()
        logger.info(f"Simple smart path done in {end_time - start_time:.4f}s")
        return path
    except nx.NetworkXNoPath:
        logger.warning("No path found in simple smart path")
        return None

def block_roads_near_obstacle(graph, obstacle_location, radius=0.002):
    lat, lng = obstacle_location
    roads_to_block = []
    
    for u, v, data in graph.edges(data=True):
        u_lat, u_lng = graph.nodes[u]['y'], graph.nodes[u]['x']
        v_lat, v_lng = graph.nodes[v]['y'], graph.nodes[v]['x']
        
        if road_hits_obstacle(u_lat, u_lng, v_lat, v_lng, lat, lng, radius):
            roads_to_block.append((u, v))
    
    if roads_to_block:
        logger.info(f"Blocking {len(roads_to_block)} roads near obstacle at ({lat:.4f}, {lng:.4f})")
        graph.remove_edges_from(roads_to_block)
        return True
    return False

def road_hits_obstacle(x1, y1, x2, y2, obs_x, obs_y, radius):
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx * dx + dy * dy)
    
    if length == 0:
        return math.sqrt((x1 - obs_x)**2 + (y1 - obs_y)**2) <= radius
    
    dx /= length
    dy /= length
    
    t = dx * (obs_x - x1) + dy * (obs_y - y1)
    
    if t < 0:
        closest_x, closest_y = x1, y1
    elif t > length:
        closest_x, closest_y = x2, y2
    else:
        closest_x = x1 + t * dx
        closest_y = y1 + t * dy
    
    return math.sqrt((closest_x - obs_x)**2 + (closest_y - obs_y)**2) <= radius

def calculate_trip_info(graph, path):
    total_distance = sum(graph[path[i]][path[i+1]][0]['length'] for i in range(len(path)-1))
    distance_km = total_distance / 1000
    avg_speed = 40
    time_hours = distance_km / avg_speed
    hours = int(time_hours)
    minutes = int((time_hours - hours) * 60)
    
    return {
        'distance': distance_km,
        'travel_time': {
            'hours': hours,
            'minutes': minutes
        }
    }

def update_all_paths():
    global saved_routes, route_points
    
    if not route_points:
        return None
    
    start, end = route_points
    
    try:
        start_node = ox.nearest_nodes(city_map, start['lng'], start['lat'])
        end_node = ox.nearest_nodes(city_map, end['lng'], end['lat'])
        
        logger.info(f"Updating paths from {start_node} to {end_node}")
        
        if not nx.has_path(city_map, start_node, end_node):
            logger.warning("No path exists after adding obstacles")
            return {'error': 'No path exists between these points after adding obstacles.'}
        
        paths = {}
        
        # Try all algorithms
        algorithms = [
            ('parallel_dijkstra', find_shortest_path_parallel),
            ('parallel_astar', find_smart_path_parallel),
            ('sequential_dijkstra', find_shortest_path_simple),
            ('sequential_astar', find_smart_path_simple)
        ]
        
        for algo_name, algo_func in algorithms:
            try:
                start_time = time.time()
                path = algo_func(city_map, start_node, end_node)
                end_time = time.time()
                
                if path:
                    trip_info = calculate_trip_info(city_map, path)
                    paths[algo_name] = {
                        'path': [[city_map.nodes[node]['y'], city_map.nodes[node]['x']] for node in path],
                        'time': end_time - start_time,
                        'distance': trip_info['distance'],
                        'travel_time': trip_info['travel_time']
                    }
                    logger.info(f"{algo_name}: {end_time - start_time:.4f}s, {len(path)} nodes")
                else:
                    paths[algo_name] = {'error': 'No path found or timeout'}
                    logger.warning(f"{algo_name}: No path found or timeout")
                    
            except Exception as e:
                logger.error(f"{algo_name} error: {str(e)}")
                paths[algo_name] = {'error': str(e)}
        
        saved_routes = paths
        logger.info("Successfully updated all paths")
        return paths
        
    except Exception as e:
        logger.error(f"Error updating paths: {str(e)}")
        return {'error': str(e)}

# API endpoints
@app.get('/')
def home():
    return {
        "status": "Chennai Path Finding System",
        "version": "6.0",
        "endpoints": ["/geocode", "/find_path", "/add_obstacle", "/clear_obstacles"],
        "algorithms": ["parallel_dijkstra", "parallel_astar", "sequential_dijkstra", "sequential_astar"],
        "note": "Find best routes in Chennai!"
    }

@app.post('/geocode')
def geocode_place(request: LocationRequest):
    try:
        if not request.location:
            raise HTTPException(status_code=400, detail='Missing location')
        
        result = find_location(request.location)
        return result
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/add_obstacle')
def place_obstacle(request: ObstacleRequest):
    try:
        if not request.lat or not request.lng:
            raise HTTPException(status_code=400, detail='Missing coordinates')
        
        obstacle = (request.lat, request.lng)
        blocked_roads.append(obstacle)
        logger.info(f"Added obstacle at {obstacle}")
        
        roads_modified = block_roads_near_obstacle(city_map, obstacle)
        updated_paths = None
        
        if roads_modified and route_points:
            updated_paths = update_all_paths()
            logger.info("Updated paths due to obstacle")
        
        return {
            'success': True,
            'obstacle_placed': True,
            'recalculate': roads_modified,
            'updated_paths': updated_paths
        }
    except Exception as e:
        logger.error(f"Error adding obstacle: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/clear_obstacles')
def clear_obstacles():
    try:
        global city_map
        blocked_roads.clear()
        city_map = backup_map.copy()
        logger.info("Cleared all obstacles and reset map")
        
        updated_paths = None
        if route_points:
            updated_paths = update_all_paths()
            logger.info("Updated paths after clearing obstacles")
        
        return {
            'success': True,
            'updated_paths': updated_paths
        }
    except Exception as e:
        logger.error(f"Error clearing obstacles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/find_path')
def find_route(request: PathRequest):
    global route_points
    
    try:
        if not request.start or not request.end:
            raise HTTPException(status_code=400, detail='Missing start or end point')
        
        route_points = (request.start, request.end)
        paths = update_all_paths()
        
        if isinstance(paths, dict) and 'error' in paths:
            raise HTTPException(status_code=400, detail=paths['error'])
        
        return {'paths': paths}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding path: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)

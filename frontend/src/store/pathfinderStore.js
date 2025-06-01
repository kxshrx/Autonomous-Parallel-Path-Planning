import { create } from 'zustand';

export const usePathfinderStore = create((set, get) => ({
  // Location state
  startLocation: null,
  endLocation: null,
  startLocationText: '',
  endLocationText: '',
  
  // Path state - Updated for 5 algorithms
  paths: {
    parallel_dijkstra: null,
    parallel_astar: null,
    parallel_bellman_ford: null,
    sequential_dijkstra: null,
    sequential_astar: null,
  },
  isCalculating: false,
  fastestAlgorithm: null,
  
  // Obstacle state
  obstacles: [],
  obstacleMode: false,
  
  // UI state
  selectedAlgorithm: null,
  currentUITheme: 'minimalist', // Default theme
  
  // Actions
  setStartLocation: (location, text = '') => set({ 
    startLocation: location, 
    startLocationText: text 
  }),
  setEndLocation: (location, text = '') => set({ 
    endLocation: location, 
    endLocationText: text 
  }),
  setPaths: (paths) => {
    // Find fastest algorithm
    const validPaths = Object.entries(paths).filter(([_, data]) => data && !data.error);
    const fastest = validPaths.reduce((a, b) => 
      a[1].time < b[1].time ? a : b, 
      ['', { time: Infinity }]
    )[0];
    
    set({ 
      paths, 
      fastestAlgorithm: fastest,
      selectedAlgorithm: fastest // Auto-select fastest
    });
  },
  setIsCalculating: (calculating) => set({ isCalculating: calculating }),
  addObstacle: (obstacle) => set((state) => ({ 
    obstacles: [...state.obstacles, obstacle] 
  })),
  clearObstacles: () => set({ obstacles: [] }),
  setObstacleMode: (mode) => set({ obstacleMode: mode }),
  setSelectedAlgorithm: (algorithm) => set({ selectedAlgorithm: algorithm }),
  setUITheme: (theme) => set({ currentUITheme: theme }),
  reset: () => set({
    startLocation: null,
    endLocation: null,
    startLocationText: '',
    endLocationText: '',
    paths: {
      parallel_dijkstra: null,
      parallel_astar: null,
      parallel_bellman_ford: null,
      sequential_dijkstra: null,
      sequential_astar: null,
    },
    obstacles: [],
    selectedAlgorithm: null,
    fastestAlgorithm: null,
  }),
}));

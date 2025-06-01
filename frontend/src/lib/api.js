// src/lib/api.js
import axios from 'axios';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-name.onrender.com'
  : 'http://localhost:9000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pathfinderAPI = {
  geocode: async (location) => {
    const response = await api.post('/geocode', { location });
    return response.data;
  },

  findPath: async (start, end) => {
    const response = await api.post('/find_path', { start, end });
    return response.data;
  },

  addObstacle: async (coordinates) => {
    const response = await api.post('/add_obstacle', {
      lat: coordinates.lat,
      lng: coordinates.lng,
    });
    return response.data;
  },

  clearObstacles: async () => {
    const response = await api.post('/clear_obstacles');
    return response.data;
  },
};

// Keep your utility functions as they are...
export const formatLocationName = (geocodedResult) => {
  if (typeof geocodedResult === 'string') return geocodedResult;
  return geocodedResult.display_name || geocodedResult.formatted_address || 'Unknown Location';
};

export const calculateSpeedup = (baseTime, comparisonTime) => {
  if (!baseTime || !comparisonTime) return 0;
  return baseTime / comparisonTime;
};

export const getTrafficCondition = (avgSpeed) => {
  if (avgSpeed > 35) return { label: "Light Traffic", color: "#34C759", icon: "🟢" };
  if (avgSpeed > 20) return { label: "Moderate Traffic", color: "#FF9500", icon: "🟡" };
  return { label: "Heavy Traffic", color: "#FF3B30", icon: "🔴" };
};

export const formatTime = (seconds) => {
  if (seconds < 1) return `${(seconds * 1000).toFixed(2)}ms`;
  return `${seconds.toFixed(3)}s`;
};

export const formatDistance = (km) => {
  if (km < 1) return `${(km * 1000).toFixed(0)}m`;
  return `${km.toFixed(2)}km`;
};

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathfinderStore } from '@/store/pathfinderStore';
import { pathfinderAPI } from '@/lib/api';

// Import Leaflet dynamically to avoid SSR issues
let L;
let MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap;

const algorithmColors = {
  parallel_dijkstra: '#007AFF',
  parallel_astar: '#5856D6', 
  parallel_bellman_ford: '#FF9500',
  sequential_dijkstra: '#30D158',
  sequential_astar: '#FF2D55',
};

export default function PathfinderMap() {
  const [isClient, setIsClient] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [hasAutoZoomed, setHasAutoZoomed] = useState(false);

  const { 
    startLocation, 
    endLocation, 
    paths, 
    obstacles,
    selectedAlgorithm,
    obstacleMode, 
    addObstacle, 
    setStartLocation,
    setEndLocation,
    setPaths
  } = usePathfinderStore();

  // Load Leaflet on client side only
  useEffect(() => {
    setIsClient(true);
    
    const loadLeaflet = async () => {
      try {
        // Dynamic imports for Leaflet
        L = (await import('leaflet')).default;
        const reactLeaflet = await import('react-leaflet');
        
        MapContainer = reactLeaflet.MapContainer;
        TileLayer = reactLeaflet.TileLayer;
        Marker = reactLeaflet.Marker;
        Polyline = reactLeaflet.Polyline;
        useMapEvents = reactLeaflet.useMapEvents;
        useMap = reactLeaflet.useMap;

        // Fix default markers
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setLeafletLoaded(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    loadLeaflet();
  }, []);

  // Custom marker icons
  const createCustomIcon = (color, size = 32) => {
    if (!L) return null;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size/3}px;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
  };

  // Enhanced Auto-zoom component
  function AutoZoom() {
    const map = useMap();

    useEffect(() => {
      setMapInstance(map);
    }, [map]);

    useEffect(() => {
      if (startLocation && endLocation && !hasAutoZoomed) {
        // Create bounds from both locations
        const bounds = L.latLngBounds([startLocation, endLocation]);
        
        // Fit bounds with padding and closer zoom
        map.fitBounds(bounds, { 
          padding: [20, 20], // Reduced padding for closer view
          maxZoom: 15 // Closer zoom level
        });
        
        setHasAutoZoomed(true);
        console.log('Auto-zoomed to fit both markers');
      } else if ((startLocation || endLocation) && !hasAutoZoomed) {
        // Zoom to single marker
        const location = startLocation || endLocation;
        map.setView(location, 14); // Close zoom for single marker
        setHasAutoZoomed(true);
        console.log('Auto-zoomed to single marker');
      }
    }, [map, startLocation, endLocation, hasAutoZoomed]);

    return null;
  }

  // Reset auto-zoom when locations are cleared
  useEffect(() => {
    if (!startLocation && !endLocation) {
      setHasAutoZoomed(false);
      if (mapInstance) {
        mapInstance.setView([13.0827, 80.2707], 12); // Reset to Chennai default
      }
    }
  }, [startLocation, endLocation, mapInstance]);

  // Reset auto-zoom when new locations are set (for re-zooming)
  useEffect(() => {
    if (startLocation || endLocation) {
      setHasAutoZoomed(false);
    }
  }, [startLocation?.lat, startLocation?.lng, endLocation?.lat, endLocation?.lng]);

  // Map event handler
  function MapEventHandler() {
    useMapEvents({
      click: async (e) => {
        if (obstacleMode) {
          try {
            console.log('Adding obstacle at:', e.latlng);
            const result = await pathfinderAPI.addObstacle(e.latlng);
            
            if (result.success) {
              addObstacle({
                id: Date.now().toString(),
                coordinates: e.latlng,
              });
              
              if (result.updated_paths) {
                console.log('Received updated paths from backend:', result.updated_paths);
                const transformedPaths = {};
                Object.entries(result.updated_paths).forEach(([algorithm, data]) => {
                  transformedPaths[algorithm] = data.error ? null : data;
                });
                setPaths(transformedPaths);
                console.log('Paths updated automatically due to obstacle');
              }
            }
          } catch (error) {
            console.error('Failed to add obstacle:', error);
          }
        } else {
          // Reset auto-zoom flag when setting new locations via click
          setHasAutoZoomed(false);
          
          if (!startLocation) {
            setStartLocation(e.latlng);
          } else if (!endLocation) {
            setEndLocation(e.latlng);
          } else {
            setStartLocation(e.latlng);
            setEndLocation(null);
          }
        }
      },
    });

    return null;
  }

  // Show loading state
  if (!isClient || !leafletLoaded) {
    return (
      <div className="map-loading">
        <div>Loading Map...</div>
      </div>
    );
  }

  // Get the selected path data
  const selectedPath = selectedAlgorithm && paths[selectedAlgorithm] && !paths[selectedAlgorithm].error
    ? paths[selectedAlgorithm]
    : null;

  const startIcon = createCustomIcon('#34C759');
  const endIcon = createCustomIcon('#FF3B30');

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[13.0827, 80.2707]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        ref={mapRef}
        minZoom={10}
        maxZoom={18}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <AutoZoom />
        <MapEventHandler />
        
        {/* Start marker */}
        {startLocation && startIcon && (
          <Marker position={startLocation} icon={startIcon} />
        )}
        
        {/* End marker */}
        {endLocation && endIcon && (
          <Marker position={endLocation} icon={endIcon} />
        )}
        
        {/* Obstacle markers */}
        {obstacles.map((obstacle) => {
          const obstacleIcon = createCustomIcon('#FF3B30', 24);
          return obstacleIcon ? (
            <Marker
              key={obstacle.id}
              position={obstacle.coordinates}
              icon={obstacleIcon}
            />
          ) : null;
        })}
        
        {/* Show only selected path */}
        {selectedPath && selectedPath.path && (
          <Polyline
            key={`${selectedAlgorithm}-${Date.now()}`}
            positions={selectedPath.path}
            color={algorithmColors[selectedAlgorithm]}
            weight={5}
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
}

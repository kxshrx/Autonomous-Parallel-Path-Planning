"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathfinderStore } from "@/store/pathfinderStore";
import { pathfinderAPI } from "@/lib/api";

// Dynamically import your map component
const PathfinderMap = dynamic(() => import("@/components/Map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div>Loading Map...</div>
    </div>
  ),
});

export default function Home() {
  const {
    startLocation,
    endLocation,
    startLocationText,
    endLocationText,
    setStartLocation,
    setEndLocation,
    paths,
    setPaths,
    isCalculating,
    setIsCalculating,
    obstacles,
    clearObstacles,
    obstacleMode,
    setObstacleMode,
    selectedAlgorithm,
    setSelectedAlgorithm,
    fastestAlgorithm,
    reset,
  } = usePathfinderStore();

  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [error, setError] = useState(null);

  const handleGeocodeLocation = async (location, type) => {
    try {
      const result = await pathfinderAPI.geocode(location);
      const coordinates = { lat: result.lat, lng: result.lng };

      if (type === "start") {
        setStartLocation(coordinates, location);
        setStartInput("");
      } else {
        setEndLocation(coordinates, location);
        setEndInput("");
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      setError("Location not found. Please try a different search term.");
    }
  };

  const handleFindPath = async () => {
    if (!startLocation || !endLocation) {
      setError("Please set both start and end locations");
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const result = await pathfinderAPI.findPath(startLocation, endLocation);

      const transformedPaths = {};
      Object.entries(result.paths).forEach(([algorithm, data]) => {
        transformedPaths[algorithm] = data.error ? null : data;
      });

      setPaths(transformedPaths);
    } catch (error) {
      console.error("Path finding failed:", error);
      setError("Failed to calculate path. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClearObstacles = async () => {
    try {
      await pathfinderAPI.clearObstacles();
      clearObstacles();

      if (startLocation && endLocation) {
        setTimeout(() => handleFindPath(), 500);
      }
    } catch (error) {
      console.error("Failed to clear obstacles:", error);
    }
  };

  const validPaths = Object.entries(paths).filter(
    ([_, data]) => data && !data.error
  );
  const currentPath =
    selectedAlgorithm &&
    paths[selectedAlgorithm] &&
    !paths[selectedAlgorithm].error
      ? paths[selectedAlgorithm]
      : null;

  return (
    <div className="container">
      {/* Map - Now on Left */}
      <div className="map-section">
        <PathfinderMap />
      </div>

      {/* Sidebar - Now on Right */}
      <div className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <h1 className="app-title">
            Autonomous Parallel Path Planning System
          </h1>
          <p className="app-subtitle">
            Advanced parallel pathfinding algorithms for autonomous navigation
          </p>
        </div>

        {/* Content */}
        <div className="sidebar-content">
          {/* Location Inputs */}
          <div className="section">
            <h3 className="section-title">Route Planning</h3>

            <div className="input-group">
              <label>
                <span className="status-indicator"></span>
                Starting Point
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter starting location..."
                value={startLocationText || startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleGeocodeLocation(e.target.value, "start");
                  }
                }}
              />
              <button
                className="btn"
                onClick={() => handleGeocodeLocation(startInput, "start")}
                disabled={!startInput.trim()}
              >
                Set Start Point
              </button>
            </div>

            <div className="input-group">
              <label>
                <span className="status-indicator"></span>
                Destination
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter destination..."
                value={endLocationText || endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleGeocodeLocation(e.target.value, "end");
                  }
                }}
              />
              <button
                className="btn"
                onClick={() => handleGeocodeLocation(endInput, "end")}
                disabled={!endInput.trim()}
              >
                Set Destination
              </button>
            </div>

            <div className="control-group">
              <button
                className={`btn btn-full ${isCalculating ? "calculating" : ""}`}
                onClick={handleFindPath}
                disabled={isCalculating || !startLocation || !endLocation}
              >
                {isCalculating ? "Calculating Routes..." : "Find Optimal Path"}
              </button>

              <button className="btn btn-secondary btn-full" onClick={reset}>
                Reset All
              </button>
            </div>

            {error && (
              <div
                className="help-text"
                style={{
                  borderLeftColor: "#ef4444",
                  background: "#fef2f2",
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Obstacle Controls */}
          <div className="section">
            <div className="obstacle-controls">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="obstacleMode"
                  checked={obstacleMode}
                  onChange={(e) => setObstacleMode(e.target.checked)}
                />
                <label htmlFor="obstacleMode">Obstacle Mode</label>
              </div>

              <button className="btn btn-danger" onClick={handleClearObstacles}>
                Clear All Obstacles
              </button>

              <div className="help-text">
                {obstacleMode
                  ? "Click on roads to add obstacles. Paths will recalculate automatically."
                  : "Click on the map to set start and end points."}
              </div>
            </div>
          </div>

          {/* Travel Information */}
          <div className="section">
            <h3 className="section-title">Travel Information</h3>
            <div className="travel-info">
              {currentPath ? (
                <>
                  <div className="travel-metric">
                    <span className="metric-label">Distance</span>
                    <span className="metric-value">
                      {currentPath.distance.toFixed(2)} km
                    </span>
                  </div>
                  <div className="travel-metric">
                    <span className="metric-label">Est. Travel Time</span>
                    <span className="metric-value">
                      {currentPath.travel_time.hours}h{" "}
                      {currentPath.travel_time.minutes}m
                    </span>
                  </div>
                  <div className="travel-metric">
                    <span className="metric-label">Algorithm</span>
                    <span className="metric-value">
                      {selectedAlgorithm?.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <div className="travel-metric">
                    <span className="metric-label">Computation Time</span>
                    <span className="metric-value">
                      {(currentPath.time * 1000).toFixed(2)}ms
                    </span>
                  </div>
                </>
              ) : (
                <div className="no-data">
                  Calculate a path to see travel details
                </div>
              )}
            </div>
          </div>

          {/* Algorithm Performance */}
          <div className="section">
            <h3 className="section-title">Algorithm Performance</h3>
            {validPaths.length > 0 ? (
              <div>
                {validPaths.map(([algorithm, data]) => {
                  const isFastest = algorithm === fastestAlgorithm;
                  const isSelected = selectedAlgorithm === algorithm;

                  return (
                    <div
                      key={algorithm}
                      className={`algorithm-card ${
                        isSelected ? "selected" : ""
                      } ${isFastest ? "fastest" : ""}`}
                      onClick={() =>
                        setSelectedAlgorithm(isSelected ? null : algorithm)
                      }
                    >
                      <div className="algorithm-name">
                        {algorithm.replace("_", " ")}
                        {isFastest && " • Fastest"}
                      </div>
                      <div className="algorithm-time">
                        {(data.time * 1000).toFixed(2)}ms
                      </div>
                      <div className="algorithm-details">
                        {data.distance.toFixed(2)} km • {data.travel_time.hours}
                        h {data.travel_time.minutes}m
                      </div>
                    </div>
                  );
                })}

                <div className="performance-summary">
                  <h4>Performance Summary</h4>
                  <div className="metric">
                    <span>Total Algorithms:</span>
                    <span>{validPaths.length}</span>
                  </div>
                  <div className="metric">
                    <span>Fastest Algorithm:</span>
                    <span>{fastestAlgorithm?.replace("_", " ")}</span>
                  </div>
                  <div className="metric">
                    <span>Best Time:</span>
                    <span>
                      {fastestAlgorithm && paths[fastestAlgorithm]
                        ? (paths[fastestAlgorithm].time * 1000).toFixed(2) +
                          "ms"
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="no-data">
                  Calculate a path to see performance metrics
                </div>
              </div>
            )}
          </div>

          {/* GitHub Link */}
          <div className="section">
            <a
              href="https://github.com/kxshrx/Autonomous-Parallel-Path-Planning"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-full github-btn"
            >
              <svg
                className="github-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>View on GitHub</span>
              <svg
                className="external-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m7 17 10-10" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

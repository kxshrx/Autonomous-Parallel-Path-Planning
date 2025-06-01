'use client';

import { usePathfinderStore } from '@/store/pathfinderStore';
import { getTrafficCondition } from '@/lib/api';

export default function TravelTimeCard() {
  const { paths, selectedAlgorithm, fastestAlgorithm } = usePathfinderStore();
  
  // Get the selected path or fastest path
  const currentPath = selectedAlgorithm && paths[selectedAlgorithm] 
    ? paths[selectedAlgorithm] 
    : fastestAlgorithm && paths[fastestAlgorithm] 
    ? paths[fastestAlgorithm] 
    : null;

  if (!currentPath || currentPath.error) {
    return (
      <div className="travel-time-card">
        <h3 className="card-title">Travel Information</h3>
        <p className="no-data">Calculate a path to see travel details</p>
      </div>
    );
  }

  const avgSpeed = 40; // km/h from backend
  const traffic = getTrafficCondition(avgSpeed);
  const currentAlgo = selectedAlgorithm || fastestAlgorithm;

  return (
    <div className="travel-time-card">
      <div className="card-header">
        <h3 className="card-title">Travel Information</h3>
        <span className="algorithm-badge" style={{ backgroundColor: currentAlgo === fastestAlgorithm ? '#34C759' : '#007AFF' }}>
          {currentAlgo?.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      
      <div className="travel-metrics">
        <div className="metric-row">
          <div className="metric-item">
            <span className="metric-label">Distance</span>
            <span className="metric-value">{currentPath.distance.toFixed(2)} km</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Est. Travel Time</span>
            <span className="metric-value">
              {currentPath.travel_time.hours}h {currentPath.travel_time.minutes}m
            </span>
          </div>
        </div>
        
        <div className="metric-row">
          <div className="metric-item">
            <span className="metric-label">Average Speed</span>
            <span className="metric-value">{avgSpeed} km/h</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Traffic Condition</span>
            <span className="metric-value" style={{ color: traffic.color }}>
              {traffic.icon} {traffic.label}
            </span>
          </div>
        </div>
        
        <div className="metric-row">
          <div className="metric-item">
            <span className="metric-label">Computation Time</span>
            <span className="metric-value">{(currentPath.time * 1000).toFixed(2)}ms</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Route Efficiency</span>
            <span className="metric-value">
              {currentAlgo === fastestAlgorithm ? '🏆 Optimal' : '⚡ Good'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

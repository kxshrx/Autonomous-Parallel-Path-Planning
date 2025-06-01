'use client';

import { useState } from 'react';
import { usePathfinderStore } from '@/store/pathfinderStore';
import { pathfinderAPI } from '@/lib/api';

export default function PathControls({ className = '' }) {
  const {
    startLocation,
    endLocation,
    isCalculating,
    setIsCalculating,
    setPaths,
    obstacleMode,
    setObstacleMode,
    clearObstacles,
    reset,
    currentUITheme
  } = usePathfinderStore();

  const [error, setError] = useState(null);

  const handleFindPath = async () => {
    if (!startLocation || !endLocation) {
      setError('Please set both start and end locations');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      console.log('Finding path from:', startLocation, 'to:', endLocation);
      const result = await pathfinderAPI.findPath(startLocation, endLocation);
      
      const transformedPaths = {};
      Object.entries(result.paths).forEach(([algorithm, data]) => {
        transformedPaths[algorithm] = data.error ? null : data;
      });
      
      setPaths(transformedPaths);
      console.log('Paths calculated:', transformedPaths);
    } catch (error) {
      console.error('Path finding failed:', error);
      setError('Failed to calculate path. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClearObstacles = async () => {
    try {
      console.log('Clearing obstacles...');
      await pathfinderAPI.clearObstacles();
      clearObstacles();
      
      // Automatically recalculate if paths exist
      if (startLocation && endLocation) {
        console.log('Recalculating after clearing obstacles...');
        setTimeout(() => handleFindPath(), 500);
      }
    } catch (error) {
      console.error('Failed to clear obstacles:', error);
    }
  };

  const getThemeClasses = () => {
    switch (currentUITheme) {
      case 'dark':
        return {
          container: 'bg-gray-800 border-gray-700',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          secondaryButton: 'bg-gray-600 hover:bg-gray-700 text-white',
          dangerButton: 'bg-red-600 hover:bg-red-700 text-white',
          text: 'text-white',
          error: 'bg-red-900/50 border-red-600 text-red-200'
        };
      case 'glassmorphism':
        return {
          container: 'bg-white/20 backdrop-blur-md border-white/30',
          button: 'bg-white/30 hover:bg-white/40 backdrop-blur-md text-gray-800 border border-white/30',
          secondaryButton: 'bg-white/20 hover:bg-white/30 backdrop-blur-md text-gray-800 border border-white/30',
          dangerButton: 'bg-red-500/30 hover:bg-red-500/40 backdrop-blur-md text-red-800 border border-red-300/30',
          text: 'text-gray-800',
          error: 'bg-red-500/20 backdrop-blur-md border-red-300/30 text-red-800'
        };
      case 'neumorphism':
        return {
          container: 'bg-gray-100 shadow-neumorphism',
          button: 'bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-neumorphism hover:shadow-neumorphism-pressed',
          secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-neumorphism hover:shadow-neumorphism-pressed',
          dangerButton: 'bg-red-100 hover:bg-red-200 text-red-800 shadow-neumorphism hover:shadow-neumorphism-pressed',
          text: 'text-gray-800',
          error: 'bg-red-50 border-red-200 text-red-800 shadow-inner'
        };
      default: // minimalist
        return {
          container: 'bg-white border-gray-200',
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          secondaryButton: 'bg-gray-500 hover:bg-gray-600 text-white',
          dangerButton: 'bg-red-500 hover:bg-red-600 text-white',
          text: 'text-gray-900',
          error: 'bg-red-50 border-red-200 text-red-800'
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className={`space-y-6 p-6 rounded-2xl border ${theme.container} ${className}`}>
      {/* Main Controls */}
      <div className="space-y-4">
        <div className="flex space-x-3">
          <button
            onClick={handleFindPath}
            disabled={isCalculating || !startLocation || !endLocation}
            className={`flex-1 px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${theme.button}`}
          >
            {isCalculating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Calculating...</span>
              </div>
            ) : (
              'Find Path'
            )}
          </button>
          
          <button
            onClick={reset}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${theme.secondaryButton}`}
          >
            Reset
          </button>
        </div>

        {error && (
          <div className={`p-4 rounded-xl border text-sm ${theme.error}`}>
            {error}
          </div>
        )}
      </div>

      {/* Obstacle Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={obstacleMode}
              onChange={(e) => setObstacleMode(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`font-medium ${theme.text}`}>Obstacle Mode</span>
          </label>
        </div>
        
        <button
          onClick={handleClearObstacles}
          className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-200 ${theme.dangerButton}`}
        >
          Clear Obstacles & Recalculate
        </button>
        
        <p className={`text-sm ${theme.text} opacity-70`}>
          {obstacleMode 
            ? '🚧 Click on roads to add obstacles (paths will auto-recalculate)' 
            : '📍 Click on the map to set start/end points'
          }
        </p>
      </div>
    </div>
  );
}

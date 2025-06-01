'use client';

import { usePathfinderStore } from '@/store/pathfinderStore';
import { calculateSpeedup, formatTime, formatDistance } from '@/lib/api';

export default function AlgorithmMetrics({ className = '' }) {
  const { 
    paths, 
    selectedAlgorithm, 
    setSelectedAlgorithm, 
    fastestAlgorithm,
    currentUITheme 
  } = usePathfinderStore();

  const validPaths = Object.entries(paths).filter(([_, data]) => data && !data.error);

  if (validPaths.length === 0) {
    return (
      <div className={`space-y-4 p-6 rounded-2xl bg-white border border-gray-200 ${className}`}>
        <h2 className="text-xl font-bold text-gray-900">Algorithm Performance</h2>
        <p className="text-gray-500">Calculate a path to see performance metrics</p>
      </div>
    );
  }

  const fastestTime = Math.min(...validPaths.map(([_, data]) => data.time));
  const slowestTime = Math.max(...validPaths.map(([_, data]) => data.time));

  const getThemeClasses = () => {
    switch (currentUITheme) {
      case 'dark':
        return {
          container: 'bg-gray-800 border-gray-700',
          card: 'bg-gray-700 border-gray-600 hover:bg-gray-600',
          cardSelected: 'bg-blue-600 border-blue-500',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          badge: 'bg-green-600 text-green-100'
        };
      case 'glassmorphism':
        return {
          container: 'bg-white/20 backdrop-blur-md border-white/30',
          card: 'bg-white/20 backdrop-blur-md border-white/30 hover:bg-white/30',
          cardSelected: 'bg-blue-500/30 border-blue-300/50',
          text: 'text-gray-800',
          textSecondary: 'text-gray-600',
          badge: 'bg-green-500/30 text-green-800 backdrop-blur-md'
        };
      case 'neumorphism':
        return {
          container: 'bg-gray-100 shadow-neumorphism',
          card: 'bg-gray-100 shadow-neumorphism hover:shadow-neumorphism-pressed',
          cardSelected: 'bg-blue-100 shadow-neumorphism-inset',
          text: 'text-gray-800',
          textSecondary: 'text-gray-600',
          badge: 'bg-green-100 text-green-800 shadow-inner'
        };
      default: // minimalist
        return {
          container: 'bg-white border-gray-200',
          card: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
          cardSelected: 'bg-blue-50 border-blue-300',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          badge: 'bg-green-100 text-green-800'
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className={`space-y-6 p-6 rounded-2xl border ${theme.container} ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${theme.text}`}>Algorithm Performance</h2>
        <span className={`text-sm ${theme.textSecondary}`}>
          {validPaths.length} algorithms
        </span>
      </div>
      
      {/* Algorithm Cards */}
      <div className="space-y-3">
        {validPaths.map(([algorithm, data]) => {
          const isFastest = algorithm === fastestAlgorithm;
          const isSelected = selectedAlgorithm === algorithm;
          const speedup = calculateSpeedup(slowestTime, data.time);
          const efficiency = (data.time / fastestTime) * 100;
          
          return (
            <div
              key={algorithm}
              onClick={() => setSelectedAlgorithm(isSelected ? null : algorithm)}
              className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected ? theme.cardSelected : theme.card
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className={`font-semibold capitalize ${theme.text}`}>
                    {algorithm.replace('_', ' ')}
                  </h3>
                  {isFastest && (
                    <span className={`px-2 py-1 text-xs rounded-full ${theme.badge}`}>
                      Fastest
                    </span>
                  )}
                </div>
                <span className={`text-lg font-mono font-bold ${theme.text}`}>
                  {formatTime(data.time)}
                </span>
              </div>
              
              <div className={`grid grid-cols-2 gap-4 text-sm ${theme.textSecondary}`}>
                <div>
                  <span className="block font-medium">Distance</span>
                  <span>{formatDistance(data.distance)}</span>
                </div>
                <div>
                  <span className="block font-medium">Est. Travel</span>
                  <span>{data.travel_time.hours}h {data.travel_time.minutes}m</span>
                </div>
                <div>
                  <span className="block font-medium">Speedup</span>
                  <span>{speedup.toFixed(2)}x</span>
                </div>
                <div>
                  <span className="block font-medium">Efficiency</span>
                  <span>{efficiency.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Summary */}
      <div className={`p-4 rounded-xl border ${theme.card}`}>
        <h3 className={`font-semibold mb-3 ${theme.text}`}>Performance Summary</h3>
        <div className={`grid grid-cols-2 gap-4 text-sm ${theme.textSecondary}`}>
          <div>
            <span className="block font-medium">Fastest Algorithm</span>
            <span className="capitalize">{fastestAlgorithm?.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="block font-medium">Best Time</span>
            <span>{formatTime(fastestTime)}</span>
          </div>
          <div>
            <span className="block font-medium">Performance Range</span>
            <span>{formatTime(fastestTime)} - {formatTime(slowestTime)}</span>
          </div>
          <div>
            <span className="block font-medium">Max Speedup</span>
            <span>{(slowestTime / fastestTime).toFixed(2)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}

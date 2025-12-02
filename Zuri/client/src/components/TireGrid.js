import React from 'react';

const TireGrid = ({ config, selectedTireId, onTireSelect, isTrailer = false }) => {
  if (!config) return null;

  const getTireColor = (tireType) => {
     switch (tireType) { 
      case 'steer':
        return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-800 border-blue-400 dark:border-blue-500 text-blue-900 dark:text-blue-100';
      case 'drive':
        return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-700 dark:to-green-800 border-green-400 dark:border-green-500 text-green-900 dark:text-green-100';
      case 'differential':
        return 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-700 dark:to-orange-800 border-orange-400 dark:border-orange-500 text-orange-900 dark:text-orange-100';
      case 'single':
        return 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-700 dark:to-purple-800 border-purple-400 dark:border-purple-500 text-purple-900 dark:text-purple-100';
      default:
        return 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100';
    }
  };

  const getTireLabel = (tire, posLookup) => {
    const baseId = (tire.id || '').startsWith('TR_') ? tire.id.substring(3) : tire.id;
    const pos = posLookup && posLookup[tire.id];
    return pos ? `P${pos}` : baseId;
  };

  // Create grid layout
  const posLookup = {};
  if (config.allTires && Array.isArray(config.allTires)) {
    config.allTires.forEach(t => { posLookup[t.id] = t.posNumber; });
  }
  const vehiclePart = config.vehicle || config;
  const grid = Array(vehiclePart.rows).fill(null).map(() => Array(vehiclePart.cols).fill(null));
  if (vehiclePart && Array.isArray(vehiclePart.tires)) {
    vehiclePart.tires.forEach(tire => {
      const [row, col] = tire.position;
      if (typeof row === 'number' && typeof col === 'number' && grid[row]) {
        grid[row][col] = tire;
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="inline-flex flex-col gap-3 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-3">
            {row.map((tire, colIdx) => (
              <div key={`${rowIdx}-${colIdx}`} className="flex items-center justify-center">
                {tire ? (
                  <button
                    onClick={() => onTireSelect(tire.id)}
                    className={`w-24 h-24 rounded-lg border-4 font-bold text-sm transition-all duration-200 transform hover:scale-110 flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-xl ${
                      selectedTireId === tire.id
                        ? 'ring-4 ring-yellow-400 ring-offset-2 dark:ring-offset-gray-900 scale-110 shadow-2xl'
                        : 'hover:shadow-lg'
                    } ${getTireColor(tire.type)}`}
                    title={tire.label}
                  >
                    <span className="text-2xl font-bold">{getTireLabel(tire, posLookup)}</span>
                    <span className="text-xs font-semibold opacity-60">{tire.type.substring(0, 3).toUpperCase()}</span>
                  </button>
                ) : (
                  <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-lg border-4 border-dashed border-gray-400 dark:border-gray-500 opacity-40"></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      {/* Trailer(s) visual if present in composed config */}
      {config.trailers && Array.isArray(config.trailers) && config.trailers.length > 0 && (
        <div className="flex gap-8 mt-4">
          {config.trailers.map((trailer, tIdx) => (
            trailer && trailer.length > 0 ? (
              <div key={tIdx} className="flex flex-col items-center gap-3">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trailer {tIdx + 1}</div>
                <div className="inline-flex flex-col gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                  {trailer.map((tire, idx) => (
                    <button
                      key={tire.id}
                      onClick={() => onTireSelect(tire.id)}
                      className={`w-20 h-20 rounded-lg border-4 font-bold text-sm transition-all duration-200 transform hover:scale-110 flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-xl ${getTireColor(tire.type)}`}
                      title={tire.label}
                    >
                      <span className="text-xl font-bold">{posLookup[tire.id] ? `P${posLookup[tire.id]}` : tire.id}</span>
                      <span className="text-xs font-semibold opacity-60">{tire.type.substring(0, 3).toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-6 text-sm justify-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 rounded"></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Steer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400 rounded"></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Drive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-orange-100 to-orange-200 border-2 border-orange-400 rounded"></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Tandem</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-400 rounded"></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Trailer</span>
        </div>
      </div>
    </div>
  );
};

export default TireGrid;

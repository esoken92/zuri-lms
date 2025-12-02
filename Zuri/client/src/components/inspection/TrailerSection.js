import React from 'react';
import TireGrid from './TireGrid';

function TrailerSection({
  trailer,
  trailerNumber,
  configurations,
  onTrailerChange,
  onRemoveTrailer,
  onManualConfigAdd,
  showConfigSuggestionModal,
}) {
  const handleFieldChange = (field, value) => {
    onTrailerChange({
      ...trailer,
      [field]: value,
    });
  };

  const handleTireChange = (updatedTires) => {
    onTrailerChange({
      ...trailer,
      tires: updatedTires,
    });
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trailer {trailerNumber}</h3>
        <button
          type="button"
          onClick={onRemoveTrailer}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
        >
          Remove Trailer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trailer ID / Plate <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={trailer.trailerId || ''}
            onChange={(e) => handleFieldChange('trailerId', e.target.value)}
            placeholder="e.g., TR001"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Configuration <span className="text-red-500">*</span>
            </label>
            <select
              value={trailer.configId || ''}
              onChange={(e) => handleFieldChange('configId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Configuration</option>
              {configurations && configurations.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.code} - {config.positionName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onManualConfigAdd()}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium"
              title="Manually add new configuration"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => showConfigSuggestionModal()}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-medium"
              title="Suggest new configuration to admin"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Tire Grid for Trailer */}
      {trailer.configId && trailer.tires && (
        <TireGrid
          tires={trailer.tires}
          onTireChange={handleTireChange}
          vehicleConfig={configurations?.find((c) => c.id === trailer.configId)}
        />
      )}
    </div>
  );
}

export default TrailerSection;

import React, { useState } from 'react';
import MainVehicleSection from './MainVehicleSection';
import TrailerSection from './TrailerSection';

function VehicleCard({
  vehicleIndex,
  vehicle,
  configurations,
  onVehicleChange,
  onRemoveVehicle,
  onManualConfigAdd,
  showConfigSuggestionModal,
}) {
  const [expanded, setExpanded] = useState(true);

  const handleMainVehicleIdChange = (vehicleId) => {
    onVehicleChange({
      ...vehicle,
      mainVehicle: {
        ...vehicle.mainVehicle,
        vehicleId,
      },
    });
  };

  const handleMainConfigChange = (configId) => {
    onVehicleChange({
      ...vehicle,
      mainVehicle: {
        ...vehicle.mainVehicle,
        configId,
        tires: [], // Reset tires when config changes
      },
    });
  };

  const handleMainTireChange = (tires) => {
    onVehicleChange({
      ...vehicle,
      mainVehicle: {
        ...vehicle.mainVehicle,
        tires,
      },
    });
  };

  const handleTrailerChange = (trailerIndex, updatedTrailer) => {
    const updatedTrailers = [...(vehicle.trailers || [])];
    updatedTrailers[trailerIndex] = updatedTrailer;
    onVehicleChange({
      ...vehicle,
      trailers: updatedTrailers,
    });
  };

  const handleRemoveTrailer = (trailerIndex) => {
    const updatedTrailers = vehicle.trailers.filter((_, idx) => idx !== trailerIndex);
    onVehicleChange({
      ...vehicle,
      trailers: updatedTrailers,
    });
  };

  const handleAddTrailer = () => {
    if (!vehicle.trailers) {
      vehicle.trailers = [];
    }
    if (vehicle.trailers.length < 2) {
      onVehicleChange({
        ...vehicle,
        trailers: [
          ...vehicle.trailers,
          {
            trailerId: '',
            configId: '',
            tires: [],
          },
        ],
      });
    }
  };

  return (
    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-300 dark:border-blue-500">
      {/* Header with toggle and delete */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 dark:text-blue-400 font-bold text-lg"
          >
            {expanded ? '▼' : '▶'}
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            INSPECTION {vehicleIndex + 1}
          </h2>
        </div>
        {vehicleIndex > 0 && (
          <button
            type="button"
            onClick={() => onRemoveVehicle(vehicleIndex)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium"
          >
            Delete Inspection
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Main Vehicle Section */}
          <MainVehicleSection
            mainVehicle={vehicle.mainVehicle}
            configurations={configurations}
            onVehicleIdChange={handleMainVehicleIdChange}
            onConfigChange={handleMainConfigChange}
            onTireChange={handleMainTireChange}
            onManualConfigAdd={onManualConfigAdd}
            showConfigSuggestionModal={showConfigSuggestionModal}
          />

          {/* Trailers Section */}
          {vehicle.trailers && vehicle.trailers.map((trailer, idx) => (
            <TrailerSection
              key={`trailer-${idx}`}
              trailer={trailer}
              trailerNumber={idx + 1}
              configurations={configurations}
              onTrailerChange={(updatedTrailer) => handleTrailerChange(idx, updatedTrailer)}
              onRemoveTrailer={() => handleRemoveTrailer(idx)}
              onManualConfigAdd={onManualConfigAdd}
              showConfigSuggestionModal={showConfigSuggestionModal}
            />
          ))}

          {/* Add Trailer Button */}
          {(!vehicle.trailers || vehicle.trailers.length < 2) && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleAddTrailer}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium"
              >
                <span>➕</span> Add Trailer
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VehicleCard;

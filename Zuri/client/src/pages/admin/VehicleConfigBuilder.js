import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TIRE_TYPES = ['steer', 'drive', 'differential', 'single', 'trailer', 'roll', 'spare'];

function VehicleConfigBuilder() {
  const [configs, setConfigs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    tireConfig: '', // e.g., S2.D4.D4.T4.T4
    tireSizes: {}, // e.g., { 'S2_0': '295/80R22.5', 'D4_0': '295/80R22.5', 'D4_1': '295/80R22.5', ... }
    idealPressures: {}, // e.g., { 'S2_0': 120, 'D4_0': 120, 'D4_1': 120, ... }
    pressureUnits: {}, // e.g., { 'S2_0': 'PSI', 'D4_0': 'BAR', ... }
    spares: 0,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const parseTireConfig = (config) => {
    // Parse config like "S2.D4.D4.T4.T4" into axle groups
    if (!config) return [];
    
    const parts = config.split('.');
    const axles = [];
    
    parts.forEach(part => {
      const type = part[0]; // S, D, T, R
      const count = parseInt(part.substring(1));
      
      if (!isNaN(count) && count > 0) {
        const typeMap = {
          'S': 'steer',
          'D': 'drive',
          'T': 'trailer',
          'R': 'roll'
        };
        
        axles.push({
          type: typeMap[type] || 'drive',
          count: count,
          label: type
        });
      }
    });
    
    return axles;
  };

  const fetchConfigs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/vehicle-configs`, { withCredentials: true });
      setConfigs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch vehicle configs:', err);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.itemCode || !formData.name || !formData.tireConfig) {
        alert('Please fill Item Code, Name, and Tire Config');
        return;
      }

      const payload = { ...formData };

      if (editing) {
        await axios.put(`${BASE_URL}/api/vehicle-configs/${editing.id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${BASE_URL}/api/vehicle-configs`, payload, { withCredentials: true });
      }

      await fetchConfigs();
      handleCancel();
    } catch (err) {
      console.error('Failed to save vehicle config:', err);
      alert('Failed to save vehicle configuration');
    }
  };

  const handleTireSizeChange = (axleKey, size) => {
    setFormData({
      ...formData,
      tireSizes: {
        ...formData.tireSizes,
        [axleKey]: size
      }
    });
  };

  const handleIdealPressureChange = (axleKey, pressure) => {
    setFormData({
      ...formData,
      idealPressures: {
        ...formData.idealPressures,
        [axleKey]: pressure
      }
    });
  };

  const handlePressureUnitChange = (axleKey, unit) => {
    setFormData({
      ...formData,
      pressureUnits: {
        ...formData.pressureUnits,
        [axleKey]: unit
      }
    });
  };

  const handleEdit = (config) => {
    setEditing(config);
    setFormData({
      itemCode: config.item_code || config.itemCode || '',
      name: config.name || '',
      tireConfig: config.tire_config || config.tireConfig || '',
      tireSizes: config.tire_sizes || config.tireSizes || {},
      idealPressures: config.ideal_pressures || config.idealPressures || {},
      pressureUnits: config.pressure_units || config.pressureUnits || {},
      spares: config.spares || 0,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle configuration?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/vehicle-configs/${id}`, { withCredentials: true });
      await fetchConfigs();
    } catch (err) {
      console.error('Failed to delete vehicle config:', err);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      itemCode: '',
      name: '',
      tireConfig: '',
      tireSizes: {},
      idealPressures: {},
      pressureUnits: {},
      spares: 0,
    });
  };

  const renderGrid = () => {
    const axles = parseTireConfig(formData.tireConfig);
    
    if (axles.length === 0) {
      return (
        <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
          Enter a tire config (e.g., S2.D4.D4.T4.T4) to see the layout
        </div>
      );
    }

    const getColorForType = (type) => {
      const colors = {
        'steer': 'bg-green-300 border-green-600',
        'drive': 'bg-blue-300 border-blue-600',
        'trailer': 'bg-purple-300 border-purple-600',
        'roll': 'bg-yellow-300 border-yellow-600'
      };
      return colors[type] || 'bg-gray-300 border-gray-600';
    };

    let tireNumber = 1;

    return (
      <div className="flex flex-col gap-6 p-6 bg-gray-100 dark:bg-gray-700 rounded">
        {/* Spares display */}
        {formData.spares > 0 && (
          <div className="flex gap-2 items-center justify-center pb-4 border-b-2 border-gray-400">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Spares:</span>
            {Array.from({ length: formData.spares }).map((_, idx) => (
              <div
                key={idx}
                className="w-12 h-12 border-2 rounded-full flex items-center justify-center text-xs font-bold bg-orange-300 border-orange-600"
              >
                SP
              </div>
            ))}
          </div>
        )}
        
        {/* Axle groups */}
        {axles.map((axle, axleIdx) => {
          const isDual = axle.count === 4;
          const tiresPerSide = isDual ? 2 : axle.count / 2;
          const axleKey = `${axle.label}${axle.count}_${axleIdx}`;
          const tireSize = formData.tireSizes[axleKey];
          
          const leftTires = [];
          const rightTires = [];
          
          // Generate left side tire numbers
          for (let i = 0; i < tiresPerSide; i++) {
            leftTires.push(tireNumber++);
          }
          
          // Generate right side tire numbers
          for (let i = 0; i < tiresPerSide; i++) {
            rightTires.push(tireNumber++);
          }
          
          return (
            <div key={axleIdx} className="flex flex-col items-center gap-2">
              <div className="text-center">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {axle.label}{axle.count} - {axle.type.toUpperCase()}
                </span>
                {tireSize && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-mono">
                    [{tireSize}]
                  </span>
                )}
                {formData.idealPressures[axleKey] && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-mono">
                    (Ideal: {formData.idealPressures[axleKey]} {formData.pressureUnits[axleKey] || 'PSI'})
                  </span>
                )}
              </div>
              <div className="flex gap-4">
                {/* Left side tires */}
                <div className="flex gap-1">
                  {leftTires.map((num) => (
                    <div
                      key={`tire-${num}`}
                      className={`w-24 border-2 rounded ${getColorForType(axle.type)}`}
                    >
                      <div className="text-center text-xs font-bold py-1 border-b border-gray-400">
                        {num}
                      </div>
                      <div className="p-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-semibold w-5">I:</span>
                          <div className="flex-1 h-4 border border-gray-400 rounded bg-white"></div>
                          <span className="text-[8px] w-6">mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-semibold w-5">M:</span>
                          <div className="flex-1 h-4 border border-gray-400 rounded bg-white"></div>
                          <span className="text-[8px] w-6">mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-semibold w-5">O:</span>
                          <div className="flex-1 h-4 border border-gray-400 rounded bg-white"></div>
                          <span className="text-[8px] w-6">mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-semibold w-5">P:</span>
                          <div className="flex-1 h-4 border border-gray-400 rounded bg-white"></div>
                          <span className="text-[8px] w-6">{formData.pressureUnits[axleKey] || 'PSI'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Right side tires */}
                <div className="flex gap-1">
                  {rightTires.map((num) => (
                    <div
                      key={`tire-${num}`}
                      className={`w-24 border-2 rounded ${getColorForType(axle.type)}`}
                    >
                      <div className="text-center text-xs font-bold py-1 border-b border-gray-400">
                        {num}
                      </div>
                      <div className="p-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-semibold w-5">I:</span>
                          <div className="flex-1 h-4 border border-gray-400 rounded bg-white"></div>
                          <span className="text-[8px] w-6">mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-semibold w-5">M:</span>
                          <div className="flex-1 h-4 border border-gray-400 rounded bg-white"></div>
                          <span className="text-[8px] w-6">mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-semibold w-5">O:</span>
                          <div className="flex-1 h-4 border border-gray-400 rounded bg-white"></div>
                          <span className="text-[8px] w-6">mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-semibold w-5">P:</span>
                          <div className="flex-1 h-4 border border-gray-400 rounded bg-white"></div>
                          <span className="text-[8px] w-6">{formData.pressureUnits[axleKey] || 'PSI'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vehicle Configuration Builder</h1>
        <button onClick={() => setEditing({})} className="px-4 py-2 bg-green-600 text-white rounded">
          + New Configuration
        </button>
      </div>

      {(editing !== null) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold">{editing.id ? 'Edit' : 'New'} Vehicle Configuration</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-2">Item Code *</label>
              <input
                type="text"
                value={formData.itemCode}
                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })}
                placeholder="e.g., TT01, TR01"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Truck Tractor"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Number of Spares</label>
              <input
                type="number"
                value={formData.spares}
                onChange={(e) => setFormData({ ...formData, spares: Math.max(0, parseInt(e.target.value || 0)) })}
                className="w-full px-3 py-2 border rounded"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Tire Config *</label>
            <input
              type="text"
              value={formData.tireConfig}
              onChange={(e) => setFormData({ ...formData, tireConfig: e.target.value.toUpperCase() })}
              placeholder="e.g., S2.D4.D4.T4.T4"
              className="w-full px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">Format: S=Steer, D=Drive/Diff, T=Trailer, R=Roll</p>
          </div>

          {/* Tire Sizes Configuration */}
          {parseTireConfig(formData.tireConfig).length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Tire Sizes & Ideal Pressures (per axle group)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parseTireConfig(formData.tireConfig).map((axle, idx) => {
                  const axleKey = `${axle.label}${axle.count}_${idx}`;
                  const currentUnit = formData.pressureUnits[axleKey] || 'PSI';
                  return (
                    <div key={axleKey} className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {axle.label}{axle.count} - {axle.type}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Tire Size</label>
                          <input
                            type="text"
                            value={formData.tireSizes[axleKey] || ''}
                            onChange={(e) => handleTireSizeChange(axleKey, e.target.value)}
                            placeholder="e.g., 295/80R22.5"
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Ideal Pressure</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={formData.idealPressures[axleKey] || ''}
                              onChange={(e) => handleIdealPressureChange(axleKey, e.target.value)}
                              placeholder="120"
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div className="flex gap-3 mt-1">
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="radio"
                                name={`unit-${axleKey}`}
                                value="PSI"
                                checked={currentUnit === 'PSI'}
                                onChange={(e) => handlePressureUnitChange(axleKey, e.target.value)}
                              />
                              PSI
                            </label>
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="radio"
                                name={`unit-${axleKey}`}
                                value="BAR"
                                checked={currentUnit === 'BAR'}
                                onChange={(e) => handlePressureUnitChange(axleKey, e.target.value)}
                              />
                              BAR
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Tire Layout Preview</h3>
            {renderGrid()}
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">
              Save Configuration
            </button>
            <button onClick={handleCancel} className="px-4 py-2 bg-gray-400 text-white rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Saved Configurations</h2>
        <div className="space-y-2">
          {configs.length === 0 ? (
            <p className="text-gray-500">No configurations yet</p>
          ) : (
            configs.map(cfg => (
              <div key={cfg.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-bold">{cfg.item_code || cfg.itemCode}</span> - {cfg.name}
                  {(cfg.tire_config || cfg.tireConfig) && (
                    <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                      {cfg.tire_config || cfg.tireConfig}
                    </span>
                  )}
                  {(cfg.spares > 0) && (
                    <span className="ml-2 text-xs text-green-600">
                      +{cfg.spares} spare{cfg.spares > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(cfg)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cfg.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default VehicleConfigBuilder;

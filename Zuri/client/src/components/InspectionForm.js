import React, { useState } from 'react';
import axios from 'axios';
import TireGrid from './TireGrid';
import { VEHICLE_TYPES, VEHICLE_CONFIGS, composeVehicleWithTrailers } from '../data/vehicleConfigs';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function InspectionForm({ onSubmit }) {
  // Header (Survey Level)
  const [headerData, setHeaderData] = useState({
    vehicleId: '',
    customerName: '',
    location: '',
    inspectionDate: new Date().toISOString().split('T')[0],
  });

  // Vehicle Configuration
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES.CAR);
  const [trailer1Type, setTrailer1Type] = useState(null);
  const [trailer2Type, setTrailer2Type] = useState(null);
  const [customFormVisible, setCustomFormVisible] = useState(false);
  const [customFormData, setCustomFormData] = useState({ name: '', rows: 2, cols: 2, isTrailer: false });

  const vehicleConfig = composeVehicleWithTrailers(vehicleType, trailer1Type, trailer2Type) || {};

  // Tire Items (Line Items)
  const [tireItems, setTireItems] = useState([]);
  const [selectedTireId, setSelectedTireId] = useState(null);
  const [isEditingItem, setIsEditingItem] = useState(false);

  // Tire Form
  const [tireFormData, setTireFormData] = useState({
    tirePosition: '',
    treadDepth: '',
    pressure: '',
    damage: '',
    condition: '',
    photo: null,
  });

  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const totalTires = vehicleConfig.allTires?.length || vehicleConfig.tires?.length || 0;

  const DRAFT_KEY = 'zuri-inspection-draft';

  // Load draft on mount
  React.useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.headerData) setHeaderData(parsed.headerData);
        if (parsed.vehicleType) setVehicleType(parsed.vehicleType);
        if (parsed.trailer1Type !== undefined) setTrailer1Type(parsed.trailer1Type);
        if (parsed.trailer2Type !== undefined) setTrailer2Type(parsed.trailer2Type);
        if (parsed.tireItems) setTireItems(parsed.tireItems);
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
  }, []);

  // Auto-save draft to localStorage
  const saveDraft = () => {
    try {
      const draft = {
        headerData,
        vehicleType,
        trailer1Type,
        trailer2Type,
        tireItems,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }
  };

  // Clear draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      // ignore
    }
  };

  // Handle header changes
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...headerData, [name]: value };
    setHeaderData(updated);
    // Auto-save after header change
    setTimeout(saveDraft, 100);
  };

  // Handle tire selection from grid
  const handleTireSelect = (tireId) => {
    const existingTire = tireItems.find(t => t.tirePosition === tireId);
    if (existingTire) {
      setSelectedTireId(tireId);
      setTireFormData(existingTire);
      setIsEditingItem(true);
    } else {
      setSelectedTireId(tireId);
      setTireFormData({
        tirePosition: tireId,
        treadDepth: '',
        pressure: '',
        damage: '',
        condition: '',
        photo: null,
      });
      setIsEditingItem(false);
    }
    setPreview(null);
  };

  // Handle tire form changes
  const handleTireFormChange = (e) => {
    const { name, value } = e.target;
    setTireFormData({ ...tireFormData, [name]: value });
  };

  // Handle photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setTireFormData({ ...tireFormData, photo: file });
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  // Upload photo
  const uploadPhoto = async () => {
    if (!tireFormData.photo || typeof tireFormData.photo === 'string') return tireFormData.photo;
    try {
      const formData = new FormData();
      formData.append('photo', tireFormData.photo);
      const res = await axios.post(`${BASE_URL}/upload`, formData);
      return res.data.path;
    } catch (err) {
      console.error('Photo upload failed:', err);
      return null;
    }
  };

  // Save tire item
  const handleSaveTire = async () => {
    try {
      setError('');

      if (!selectedTireId || !tireFormData.treadDepth || !tireFormData.pressure) {
        setError('Please fill in Tire Position, Tread Depth, and Pressure');
        return;
      }

      let photoUrl = tireFormData.photo;
      if (tireFormData.photo && typeof tireFormData.photo === 'object') {
        photoUrl = await uploadPhoto();
      }

      const newItem = {
        ...tireFormData,
        photo: photoUrl,
      };

      // attach posNumber when available from composed config
      try {
        const lookup = vehicleConfig.allTires || [];
        const found = lookup.find(tt => tt.id === selectedTireId);
        if (found && found.posNumber) newItem.posNumber = found.posNumber;
      } catch (e) {
        // ignore
      }

      const updatedItems = isEditingItem
        ? tireItems.map(t => (t.tirePosition === selectedTireId ? newItem : t))
        : [...tireItems, newItem];

      setTireItems(updatedItems);

      // Auto-save draft after tire save
      setTimeout(saveDraft, 100);

      setSelectedTireId(null);
      setTireFormData({
        tirePosition: '',
        treadDepth: '',
        pressure: '',
        damage: '',
        condition: '',
        photo: null,
      });
      setPreview(null);
      setIsEditingItem(false);
    } catch (err) {
      setError(`Error saving tire: ${err.message}`);
    }
  };

  // Delete tire item
  const handleDeleteTire = (tireId) => {
    setTireItems(tireItems.filter(t => t.tirePosition !== tireId));
    if (selectedTireId === tireId) {
      setSelectedTireId(null);
      setIsEditingItem(false);
    }
  };

  // Save offline
  const saveOffline = (report) => {
    const existing = JSON.parse(localStorage.getItem('zuri-pending') || '[]');
    existing.push(report);
    localStorage.setItem('zuri-pending', JSON.stringify(existing));
    alert('Saved offline. Will sync when you\'re back online.');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');

      if (!headerData.vehicleId || !headerData.customerName || !headerData.location) {
        setError('Please fill in Vehicle ID, Customer Name, and Location');
        return;
      }

      if (tireItems.length === 0) {
        setError('Please add at least one tire item');
        return;
      }

      const payload = {
        ...headerData,
        items: tireItems,
        timestamp: new Date().toISOString(),
      };

      if (navigator.onLine) {
        try {
          await axios.post(`${BASE_URL}/api/inspections`, payload, { withCredentials: true });
          alert('Inspection submitted successfully!');
        } catch (err) {
          console.warn('Online submit failed, saving offline:', err);
          saveOffline(payload);
        }
      } else {
        saveOffline(payload);
      }

      // Reset form
      setHeaderData({
        vehicleId: '',
        customerName: '',
        location: '',
        inspectionDate: new Date().toISOString().split('T')[0],
      });
      setVehicleType(VEHICLE_TYPES.CAR);
      setTrailer1Type(null);
      setTrailer2Type(null);
      setTireItems([]);
      setSelectedTireId(null);
      setTireFormData({
        tirePosition: '',
        treadDepth: '',
        pressure: '',
        damage: '',
        condition: '',
        photo: null,
      });
      setPreview(null);

      // Clear draft after successful submit
      clearDraft();

      if (onSubmit) onSubmit();
    } catch (err) {
      setError(`Error submitting inspection: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Header Section - Survey Details */}
      <div className="border-l-4 border-blue-500 pl-6 py-4 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900 dark:to-transparent rounded-r-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Inspection Header</h2>

              <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Vehicle ID *
            </label>
            <input
              type="text"
              name="vehicleId"
              value={headerData.vehicleId}
              onChange={handleHeaderChange}
              placeholder="e.g., TR-001"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={headerData.customerName}
              onChange={handleHeaderChange}
              placeholder="Enter customer name"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={headerData.location}
              onChange={handleHeaderChange}
              placeholder="Enter location"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Inspection Date *
            </label>
            <input
              type="date"
              name="inspectionDate"
              value={headerData.inspectionDate}
              onChange={handleHeaderChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Vehicle Configuration */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Vehicle Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => {
                  setVehicleType(e.target.value);
                  setTireItems([]);
                  setSelectedTireId(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={VEHICLE_TYPES.CAR}>Car (2x2)</option>
                <option value={VEHICLE_TYPES.TRUCK_2AXLE}>Truck 2-Axle</option>
                <option value={VEHICLE_TYPES.TRUCK_3AXLE}>Truck 3-Axle</option>
                <option value={VEHICLE_TYPES.TRACTOR}>Tractor</option>
              </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Trailer 1 (Optional)
                  </label>
                  <select
                    value={trailer1Type || ''}
                    onChange={(e) => {
                      setTrailer1Type(e.target.value || null);
                      setTireItems([]);
                      setSelectedTireId(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">None</option>
                    {Object.keys(VEHICLE_CONFIGS).filter(k => k.startsWith('trailer') || k === VEHICLE_TYPES.TRAILER_2AXLE || k === VEHICLE_TYPES.TRAILER_3AXLE).map(k => (
                      <option key={k} value={k}>{VEHICLE_CONFIGS[k].name || k}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Trailer 2 (Optional)
                  </label>
                  <select
                    value={trailer2Type || ''}
                    onChange={(e) => {
                      setTrailer2Type(e.target.value || null);
                      setTireItems([]);
                      setSelectedTireId(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">None</option>
                    {Object.keys(VEHICLE_CONFIGS).filter(k => k.startsWith('trailer') || k === VEHICLE_TYPES.TRAILER_2AXLE || k === VEHICLE_TYPES.TRAILER_3AXLE).map(k => (
                      <option key={k} value={k}>{VEHICLE_CONFIGS[k].name || k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <button type="button" onClick={() => setCustomFormVisible(!customFormVisible)} className="mt-6 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{customFormVisible ? 'Cancel' : 'Create Custom Type'}</button>
                </div>
          </div>

              {customFormVisible && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h4 className="font-semibold mb-2">Create Custom Vehicle/Trailer</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <input value={customFormData.name} onChange={e => setCustomFormData({...customFormData, name: e.target.value})} placeholder="Name" className="px-3 py-2 rounded" />
                    <input type="number" value={customFormData.rows} onChange={e => setCustomFormData({...customFormData, rows: Math.max(1, parseInt(e.target.value || 1))})} className="px-3 py-2 rounded" />
                    <input type="number" value={customFormData.cols} onChange={e => setCustomFormData({...customFormData, cols: Math.max(1, parseInt(e.target.value || 1))})} className="px-3 py-2 rounded" />
                    <label className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={customFormData.isTrailer} onChange={e => setCustomFormData({...customFormData, isTrailer: e.target.checked})} /> Is Trailer</label>
                    <div>
                      <button type="button" onClick={() => {
                        // create a simple config
                        const key = `custom_${Date.now()}`;
                        const tires = [];
                        let idCounter = 1;
                        for (let r=0; r<customFormData.rows; r++){
                          for (let c=0; c<customFormData.cols; c++){
                            tires.push({ id: `C${idCounter++}`, type: customFormData.isTrailer ? 'single' : 'drive', position: [r,c], label: `${customFormData.name} ${r+1}-${c+1}`});
                          }
                        }
                        VEHICLE_CONFIGS[key] = {
                          name: customFormData.name || key,
                          rows: customFormData.rows,
                          cols: customFormData.cols,
                          tires,
                        };
                        // auto-select depending on isTrailer
                        if (customFormData.isTrailer) setTrailer1Type(key); else setVehicleType(key);
                        setCustomFormVisible(false);
                      }} className="px-3 py-2 bg-blue-600 text-white rounded">Create</button>
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>

      {/* Tire Grid Section */}
      <div className="border-l-4 border-green-500 pl-6 py-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900 dark:to-transparent rounded-r-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Tire Positions: {tireItems.length} / {totalTires} Inspected
          </h3>
          <div className="w-40 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${(tireItems.length / totalTires) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <TireGrid
            config={vehicleConfig}
            selectedTireId={selectedTireId}
            onTireSelect={handleTireSelect}
          />
        </div>
      </div>

      {/* Tire Items List Section */}
      {tireItems.length > 0 && (
        <div className="border-l-4 border-purple-500 pl-6 py-4 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900 dark:to-transparent rounded-r-lg">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Inspected Tires</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {tireItems.map((item) => (
              <div
                key={item.tirePosition}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-white">{item.tirePosition}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tread: {item.treadDepth}mm | Pressure: {item.pressure}bar
                    {item.damage && ` | Damage: ${item.damage}`}
                    {item.condition && ` | Condition: ${item.condition}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleTireSelect(item.tirePosition)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTire(item.tirePosition)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tire Item Form Section */}
      {selectedTireId && (
        <div className="border-l-4 border-orange-500 pl-6 py-4 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900 dark:to-transparent rounded-r-lg">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {isEditingItem ? 'Edit' : 'Add'} Tire: {selectedTireId}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tread Depth (mm) *
              </label>
              <input
                type="number"
                name="treadDepth"
                value={tireFormData.treadDepth}
                onChange={handleTireFormChange}
                placeholder="e.g., 7.5"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Pressure (bar) *
              </label>
              <input
                type="number"
                name="pressure"
                value={tireFormData.pressure}
                onChange={handleTireFormChange}
                placeholder="e.g., 2.5"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Damage
              </label>
              <input
                type="text"
                name="damage"
                value={tireFormData.damage}
                onChange={handleTireFormChange}
                placeholder="e.g., Crack, Bald"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Condition
              </label>
              <select
                name="condition"
                value={tireFormData.condition}
                onChange={handleTireFormChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">Select</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
            {(preview || (tireFormData.photo && typeof tireFormData.photo === 'string')) && (
              <img
                src={preview || `${BASE_URL}${tireFormData.photo}`}
                alt="Tire"
                className="mt-3 max-w-xs rounded-lg border"
              />
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveTire}
              className="flex-1 bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition"
            >
              Save Tire
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTireId(null);
                setTireFormData({
                  tirePosition: '',
                  treadDepth: '',
                  pressure: '',
                  damage: '',
                  condition: '',
                  photo: null,
                });
                setPreview(null);
                setIsEditingItem(false);
              }}
              className="flex-1 bg-gray-400 dark:bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-500 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={tireItems.length === 0}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✓ Submit Inspection
        </button>
        <button
          type="reset"
          className="flex-1 bg-gray-400 dark:bg-gray-600 text-white font-semibold py-3 rounded-lg hover:bg-gray-500 dark:hover:bg-gray-700 transition"
        >
          Clear Form
        </button>
      </div>
    </form>
  );
}

export default InspectionForm;

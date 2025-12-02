import React, { useState } from 'react';
import axios from 'axios';
import TireGrid from './TireGrid';
import Toast from './Toast';
import DataSuggestionModal from './DataSuggestionModal';
import { useRBAC } from '../hooks/useRBAC';
import { VEHICLE_TYPES, VEHICLE_CONFIGS, composeVehicleWithTrailers } from '../data/vehicleConfigs';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function InspectionForm({ onSubmit, user, initialData = null }) {
  // RBAC permissions
  const rbac = useRBAC(user);
  
  // Suggestion modals state
  const [suggestionModals, setSuggestionModals] = useState({
    company: false,
    depot: false,
    tyre: false,
    vehicleConfig: false,
  });

  // Manual entry modals state
  const [manualEntryModals, setManualEntryModals] = useState({
    company: false,
    depot: false,
  });

  const [manualCompanyData, setManualCompanyData] = useState({ name: '', phone: '', email: '' });
  const [manualDepotData, setManualDepotData] = useState({ location: '', region: '' });
  // Header (Survey Level)
  const [headerData, setHeaderData] = useState({
    vehicleId: '',
    customerName: '',
    location: '',
    companyId: '',
    depotId: '',
    inspectionDate: new Date().toISOString().split('T')[0],
  });

  // Dropdowns
  const [companies, setCompanies] = useState([]);
  const [depots, setDepots] = useState([]);
  const [tiresDatabase, setTiresDatabase] = useState([]);

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

  // Spare Items
  const [spareItems, setSpareItems] = useState([]);

  // Tire Form
  const [tireFormData, setTireFormData] = useState({
    tirePosition: '',
    treadDepth: '',
    pressure: '',
    idealPressure: '',
    tireSize: '',
    damage: '',
    condition: '',
    photo: null,
  });

  // Spare Form
  const [showSpareForm, setShowSpareForm] = useState(false);
  const [spareFormData, setSpareFormData] = useState({
    spareNumber: '',
    treadDepth: '',
    pressure: '',
    idealPressure: '',
    tireSize: '',
    damage: '',
    condition: '',
    photo: null,
  });

  const [preview, setPreview] = useState(null);
  const [sparePreview, setSparePreview] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const totalTires = vehicleConfig.allTires?.length || vehicleConfig.tires?.length || 0;
  const DRAFT_KEY = 'zuri-inspection-draft';

  // Load data on mount
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
        if (parsed.spareItems) setSpareItems(parsed.spareItems);
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }

    // Load dropdown data
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      const [companiesRes, depotsRes, tiresRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/table/companies`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/api/table/depots`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/api/table/tyres`, { withCredentials: true }).catch(() => ({ data: [] })),
      ]);
      setCompanies(companiesRes.data || []);
      setDepots(depotsRes.data || []);
      setTiresDatabase(tiresRes.data || []);
    } catch (err) {
      console.warn('Failed to load dropdown data:', err);
    }
  };

  const saveDraft = () => {
    try {
      const draft = {
        headerData,
        vehicleType,
        trailer1Type,
        trailer2Type,
        tireItems,
        spareItems,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      // ignore
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...headerData, [name]: value };
    
    // Auto-populate customerName from selected company
    if (name === 'companyId' && value) {
      const selectedCompany = companies.find(c => c.id === parseInt(value));
      if (selectedCompany) {
        updated.customerName = selectedCompany.name;
      }
    }
    
    setHeaderData(updated);
    setTimeout(saveDraft, 100);
  };

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
        idealPressure: '',
        tireSize: '',
        damage: '',
        condition: '',
        photo: null,
      });
      setIsEditingItem(false);
    }
    setPreview(null);
  };

  const handleTireFormChange = (e) => {
    const { name, value } = e.target;
    setTireFormData({ ...tireFormData, [name]: value });
  };

  const handleSpareFormChange = (e) => {
    const { name, value } = e.target;
    setSpareFormData({ ...spareFormData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', message: `File exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` });
      return;
    }
    setTireFormData({ ...tireFormData, photo: file });
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSparePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', message: `File exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` });
      return;
    }
    setSpareFormData({ ...spareFormData, photo: file });
    if (file) {
      setSparePreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (photoFile) => {
    if (!photoFile || typeof photoFile === 'string') return photoFile;
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      const res = await axios.post(`${BASE_URL}/upload`, formData);
      return res.data.path;
    } catch (err) {
      if (err.response?.data?.errorCode) {
        setToast({
          type: 'error',
          message: `Upload Error (${err.response.data.errorCode}): ${err.response.data.message || err.message}`
        });
      } else {
        setToast({ type: 'error', message: `Upload failed: ${err.message}` });
      }
      return null;
    }
  };

  const handleSaveTire = async () => {
    try {
      setError('');

      if (!selectedTireId || !tireFormData.treadDepth || !tireFormData.pressure) {
        setError('Please fill in Tire Position, Tread Depth, and Pressure');
        return;
      }

      let photoUrl = tireFormData.photo;
      if (tireFormData.photo && typeof tireFormData.photo === 'object') {
        photoUrl = await uploadPhoto(tireFormData.photo);
      }

      const newItem = {
        ...tireFormData,
        photo: photoUrl,
      };

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
      setTimeout(saveDraft, 100);

      setSelectedTireId(null);
      setTireFormData({
        tirePosition: '',
        treadDepth: '',
        pressure: '',
        idealPressure: '',
        tireSize: '',
        damage: '',
        condition: '',
        photo: null,
      });
      setPreview(null);
      setIsEditingItem(false);
      setToast({ type: 'success', message: 'Tire saved successfully' });
    } catch (err) {
      setError(`Error saving tire: ${err.message}`);
    }
  };

  const handleSaveSpare = async () => {
    try {
      setError('');

      if (!spareFormData.spareNumber || !spareFormData.treadDepth || !spareFormData.pressure) {
        setError('Please fill in Spare Number, Tread Depth, and Pressure');
        return;
      }

      let photoUrl = spareFormData.photo;
      if (spareFormData.photo && typeof spareFormData.photo === 'object') {
        photoUrl = await uploadPhoto(spareFormData.photo);
      }

      const newSpare = {
        ...spareFormData,
        photo: photoUrl,
      };

      const updatedSpares = [...spareItems, newSpare];
      setSpareItems(updatedSpares);
      setTimeout(saveDraft, 100);

      setSpareFormData({
        spareNumber: '',
        treadDepth: '',
        pressure: '',
        idealPressure: '',
        tireSize: '',
        damage: '',
        condition: '',
        photo: null,
      });
      setSparePreview(null);
      setShowSpareForm(false);
      setToast({ type: 'success', message: 'Spare wheel saved successfully' });
    } catch (err) {
      setError(`Error saving spare: ${err.message}`);
    }
  };

  const handleDeleteTire = (tireId) => {
    setTireItems(tireItems.filter(t => t.tirePosition !== tireId));
    if (selectedTireId === tireId) {
      setSelectedTireId(null);
      setIsEditingItem(false);
    }
  };

  const handleDeleteSpare = (spareIndex) => {
    setSpareItems(spareItems.filter((_, i) => i !== spareIndex));
  };

  const saveOffline = (report) => {
    const existing = JSON.parse(localStorage.getItem('zuri-pending') || '[]');
    existing.push(report);
    localStorage.setItem('zuri-pending', JSON.stringify(existing));
    setToast({ type: 'success', message: 'Saved offline. Will sync when back online.' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');

      if (!headerData.vehicleId || !headerData.companyId || !headerData.location) {
        setError('Please fill in Vehicle ID, Company, and Location');
        return;
      }

      if (tireItems.length === 0) {
        setError('Please add at least one tire item');
        return;
      }

      const payload = {
        ...headerData,
        customerName: headerData.customerName || companies.find(c => c.id === parseInt(headerData.companyId))?.name || '',
        items: tireItems,
        spares: spareItems,
        timestamp: new Date().toISOString(),
      };

      if (navigator.onLine) {
        try {
          await axios.post(`${BASE_URL}/api/inspections`, payload, { withCredentials: true });
          setToast({ type: 'success', message: 'Inspection submitted successfully!' });
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
        companyId: '',
        depotId: '',
        inspectionDate: new Date().toISOString().split('T')[0],
      });
      setVehicleType(VEHICLE_TYPES.CAR);
      setTrailer1Type(null);
      setTrailer2Type(null);
      setTireItems([]);
      setSpareItems([]);
      setSelectedTireId(null);
      setTireFormData({
        tirePosition: '',
        treadDepth: '',
        pressure: '',
        idealPressure: '',
        tireSize: '',
        damage: '',
        condition: '',
        photo: null,
      });
      setPreview(null);
      clearDraft();

      if (onSubmit) onSubmit();
    } catch (err) {
      setError(`Error submitting inspection: ${err.message}`);
    }
  };

  const handleManualCompanySave = async () => {
    if (!manualCompanyData.name.trim()) {
      setToast({ type: 'error', message: 'Company name is required' });
      return;
    }
    try {
      // Auto-add to suggestions/unvetted database
      await axios.post(`${BASE_URL}/api/suggestions`, {
        type: 'company',
        data: manualCompanyData,
        status: 'pending',
        suggestedBy: user?.username || 'anonymous',
        timestamp: new Date().toISOString(),
      }, { withCredentials: true }).catch(() => {
        // If API fails, still add to local list
        console.warn('Could not submit suggestion to server');
      });
      
      // Add to companies list for immediate use
      const newCompany = { id: Date.now(), ...manualCompanyData, status: 'unvetted' };
      setCompanies([...companies, newCompany]);
      
      // Auto-select the new company
      setHeaderData({
        ...headerData,
        companyId: newCompany.id,
        customerName: manualCompanyData.name,
      });
      
      setManualCompanyData({ name: '', phone: '', email: '' });
      setManualEntryModals(prev => ({ ...prev, company: false }));
      setToast({ type: 'success', message: 'Company added and pending admin review' });
    } catch (err) {
      setToast({ type: 'error', message: `Error adding company: ${err.message}` });
    }
  };

  const handleManualDepotSave = async () => {
    if (!manualDepotData.location.trim()) {
      setToast({ type: 'error', message: 'Depot location is required' });
      return;
    }
    try {
      // Auto-add to suggestions/unvetted database
      await axios.post(`${BASE_URL}/api/suggestions`, {
        type: 'depot',
        data: manualDepotData,
        status: 'pending',
        suggestedBy: user?.username || 'anonymous',
        timestamp: new Date().toISOString(),
      }, { withCredentials: true }).catch(() => {
        // If API fails, still add to local list
        console.warn('Could not submit suggestion to server');
      });
      
      // Add to depots list for immediate use
      const newDepot = { id: Date.now(), ...manualDepotData, status: 'unvetted' };
      setDepots([...depots, newDepot]);
      
      // Auto-select the new depot
      setHeaderData({
        ...headerData,
        depotId: newDepot.id,
        location: manualDepotData.location,
      });
      
      setManualDepotData({ location: '', region: '' });
      setManualEntryModals(prev => ({ ...prev, depot: false }));
      setToast({ type: 'success', message: 'Depot added and pending admin review' });
    } catch (err) {
      setToast({ type: 'error', message: `Error adding depot: ${err.message}` });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-6">
      {toast && (
        <Toast type={toast.type} message={toast.message} />
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Header Section */}
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
              Company (Optional)
            </label>
            <div className="flex gap-2">
              <select
                name="companyId"
                value={headerData.companyId}
                onChange={handleHeaderChange}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setManualEntryModals(prev => ({ ...prev, company: true }))}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-bold"
                title="Manually enter company details"
              >
                ✎
              </button>
              {rbac.canSuggestData && (
                <button
                  type="button"
                  onClick={() => setSuggestionModals(prev => ({ ...prev, company: true }))}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                  title="Suggest a new company"
                >
                  +
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Depot (Optional)
            </label>
            <div className="flex gap-2">
              <select
                name="depotId"
                value={headerData.depotId}
                onChange={handleHeaderChange}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Depot</option>
                {depots.map(d => (
                  <option key={d.id} value={d.id}>{d.location}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setManualEntryModals(prev => ({ ...prev, depot: true }))}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-bold"
                title="Manually enter depot details"
              >
                ✎
              </button>
              {rbac.canSuggestData && (
                <button
                  type="button"
                  onClick={() => setSuggestionModals(prev => ({ ...prev, depot: true }))}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                  title="Suggest a new depot"
                >
                  +
                </button>
              )}
            </div>
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
                <input value={customFormData.name} onChange={e => setCustomFormData({...customFormData, name: e.target.value})} placeholder="Name" className="px-3 py-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white" />
                <input type="number" value={customFormData.rows} onChange={e => setCustomFormData({...customFormData, rows: Math.max(1, parseInt(e.target.value || 1))})} className="px-3 py-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white" />
                <input type="number" value={customFormData.cols} onChange={e => setCustomFormData({...customFormData, cols: Math.max(1, parseInt(e.target.value || 1))})} className="px-3 py-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white" />
                <label className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={customFormData.isTrailer} onChange={e => setCustomFormData({...customFormData, isTrailer: e.target.checked})} /> Is Trailer</label>
                <div>
                  <button type="button" onClick={() => {
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
                    if (customFormData.isTrailer) setTrailer1Type(key); else setVehicleType(key);
                    setCustomFormVisible(false);
                  }} className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tire Grid */}
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

      {/* Inspected Tires */}
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
                    Tread: {item.treadDepth}mm | Pressure: {item.pressure}bar{item.idealPressure && ` | Ideal: ${item.idealPressure}bar`}{item.tireSize && ` | Size: ${item.tireSize}`}
                    {item.damage && ` | Damage: ${item.damage}`}{item.condition && ` | Condition: ${item.condition}`}
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

      {/* Spare Wheels */}
      <div className="border-l-4 border-indigo-500 pl-6 py-4 bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900 dark:to-transparent rounded-r-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Spare Wheels ({spareItems.length})</h3>
          <button
            type="button"
            onClick={() => setShowSpareForm(!showSpareForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold inline-flex items-center gap-2"
          >
            {showSpareForm ? (
              'Cancel'
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
                </svg>
                Add Spare
              </>
            )}
          </button>
        </div>

        {showSpareForm && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Spare Number (1-3) *
                </label>
                <select
                  name="spareNumber"
                  value={spareFormData.spareNumber}
                  onChange={handleSpareFormChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select</option>
                  <option value="Spare 1">Spare 1</option>
                  <option value="Spare 2">Spare 2</option>
                  <option value="Spare 3">Spare 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tire Size
                </label>
                <input
                  type="text"
                  name="tireSize"
                  value={spareFormData.tireSize}
                  onChange={handleSpareFormChange}
                  placeholder="e.g., 225/75R16"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tread Depth (mm) *
                </label>
                <input
                  type="number"
                  name="treadDepth"
                  value={spareFormData.treadDepth}
                  onChange={handleSpareFormChange}
                  step="0.1"
                  placeholder="e.g., 8"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Current Pressure (bar) *
                </label>
                <input
                  type="number"
                  name="pressure"
                  value={spareFormData.pressure}
                  onChange={handleSpareFormChange}
                  step="0.1"
                  placeholder="e.g., 2.8"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Ideal Pressure (bar)
                </label>
                <input
                  type="number"
                  name="idealPressure"
                  value={spareFormData.idealPressure}
                  onChange={handleSpareFormChange}
                  step="0.1"
                  placeholder="e.g., 3.2"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={spareFormData.condition}
                  onChange={handleSpareFormChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Damage/Notes
              </label>
              <input
                type="text"
                name="damage"
                value={spareFormData.damage}
                onChange={handleSpareFormChange}
                placeholder="e.g., Small crack"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Photo
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleSparePhotoChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              {(sparePreview || (spareFormData.photo && typeof spareFormData.photo === 'string')) && (
                <img
                  src={sparePreview || `${BASE_URL}${spareFormData.photo}`}
                  alt="Spare"
                  className="mt-3 max-w-xs rounded-lg border"
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveSpare}
                className="flex-1 bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition"
              >
                Save Spare
              </button>
              <button
                type="button"
                onClick={() => setShowSpareForm(false)}
                className="flex-1 bg-gray-400 dark:bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-500 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {spareItems.length > 0 && (
          <div className="space-y-3">
            {spareItems.map((spare, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-white">{spare.spareNumber}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Size: {spare.tireSize || 'N/A'} | Tread: {spare.treadDepth}mm | Pressure: {spare.pressure}bar{spare.idealPressure && ` | Ideal: ${spare.idealPressure}bar`}
                    {spare.damage && ` | ${spare.damage}`}{spare.condition && ` | ${spare.condition}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSpare(idx)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tire Form */}
      {selectedTireId && (
        <div className="border-l-4 border-orange-500 pl-6 py-4 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900 dark:to-transparent rounded-r-lg">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {isEditingItem ? 'Edit' : 'Add'} Tire: {selectedTireId}
          </h3>

        <div className="border p-4 bg-blue-50 dark:bg-blue-900 rounded-lg mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📋 Select Tire from Database</h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Choose an existing tire to auto-fill details:</p>
          <select
            onChange={(e) => {
              const tire = tiresDatabase.find(t => t.id === parseInt(e.target.value));
              if (tire) {
                setTireFormData({
                  ...tireFormData,
                  tireSize: tire.size || tire.tireSize || '',
                  // You can add more fields here as they become available in the tire DB
                });
                e.target.value = ''; // Reset dropdown
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">-- Select a tire size --</option>
            {tiresDatabase.map(t => (
              <option key={t.id} value={t.id}>
                {t.brand ? `${t.brand} - ` : ''}{t.size || t.tireSize || 'Unknown Size'} {t.pattern ? `(${t.pattern})` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Total available: <span className="font-semibold">{tiresDatabase.length} tires</span>
          </p>
        </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tire Size
              </label>
              <input
                type="text"
                name="tireSize"
                value={tireFormData.tireSize}
                onChange={handleTireFormChange}
                placeholder="e.g., 225/75R16"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
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
                Current Pressure (bar) *
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
                Ideal Pressure (bar)
              </label>
              <input
                type="number"
                name="idealPressure"
                value={tireFormData.idealPressure}
                onChange={handleTireFormChange}
                placeholder="e.g., 3.0"
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
              Photo (Tap to use camera on mobile)
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
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
                  idealPressure: '',
                  tireSize: '',
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

      {/* Submit */}
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

      {/* Suggestion Modals */}
      {/* Manual Entry Modals */}
      {manualEntryModals.company && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              ✎ Manually Enter Company
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={manualCompanyData.name}
                  onChange={(e) => setManualCompanyData({ ...manualCompanyData, name: e.target.value })}
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  value={manualCompanyData.phone}
                  onChange={(e) => setManualCompanyData({ ...manualCompanyData, phone: e.target.value })}
                  placeholder="Company phone"
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={manualCompanyData.email}
                  onChange={(e) => setManualCompanyData({ ...manualCompanyData, email: e.target.value })}
                  placeholder="Company email"
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleManualCompanySave}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Save & Use
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualEntryModals(prev => ({ ...prev, company: false }));
                  setManualCompanyData({ name: '', phone: '', email: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {manualEntryModals.depot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              ✎ Manually Enter Depot
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Depot Location *
                </label>
                <input
                  type="text"
                  value={manualDepotData.location}
                  onChange={(e) => setManualDepotData({ ...manualDepotData, location: e.target.value })}
                  placeholder="Enter depot location"
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Region (Optional)
                </label>
                <input
                  type="text"
                  value={manualDepotData.region}
                  onChange={(e) => setManualDepotData({ ...manualDepotData, region: e.target.value })}
                  placeholder="e.g., Northern, Southern"
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleManualDepotSave}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Save & Use
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualEntryModals(prev => ({ ...prev, depot: false }));
                  setManualDepotData({ location: '', region: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Modals */}
      <DataSuggestionModal
        isOpen={suggestionModals.company}
        onClose={() => setSuggestionModals(prev => ({ ...prev, company: false }))}
        suggestionType="company"
        user={user}
        onSuccess={() => {
          // Refresh companies list
          loadDropdownData();
        }}
      />
      <DataSuggestionModal
        isOpen={suggestionModals.depot}
        onClose={() => setSuggestionModals(prev => ({ ...prev, depot: false }))}
        suggestionType="depot"
        user={user}
        onSuccess={() => {
          // Refresh depots list
          loadDropdownData();
        }}
      />
      <DataSuggestionModal
        isOpen={suggestionModals.tyre}
        onClose={() => setSuggestionModals(prev => ({ ...prev, tyre: false }))}
        suggestionType="tyre"
        user={user}
        onSuccess={() => {
          // Refresh tyres list
          loadDropdownData();
        }}
      />
      <DataSuggestionModal
        isOpen={suggestionModals.vehicleConfig}
        onClose={() => setSuggestionModals(prev => ({ ...prev, vehicleConfig: false }))}
        suggestionType="vehicleConfig"
        user={user}
        onSuccess={() => {
          // Note: Vehicle configs are static, so no refresh needed
        }}
      />
    </form>
  );
}

export default InspectionForm;

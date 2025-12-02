import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TireGrid from '../components/TireGrid';
import { VEHICLE_TYPES, composeVehicleWithTrailers } from '../data/vehicleConfigs';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Home({ inspections, setInspections, user }) {
  // Inspection Surveys (header level) - customer/survey header
  const [inspectionSurveys, setInspectionSurveys] = useState([]);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [isAddingNewSurvey, setIsAddingNewSurvey] = useState(false);

  // Tire Items (line items) - individual tire entries
  const [tireItems, setTireItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [selectedTireId, setSelectedTireId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Inspection Survey (header) form
  const [surveyFormData, setSurveyFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    location: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    vehicleId: '',
    status: 'In Progress',
  });

  // Vehicle Configuration
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES.CAR);
  const [trailer1Type, setTrailer1Type] = useState(null);
  const [trailer2Type, setTrailer2Type] = useState(null);

  // Database lookups
  const [companies, setCompanies] = useState([]);
  const [depots, setDepots] = useState([]);
  const [vehicleConfigs, setVehicleConfigs] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customCustomer, setCustomCustomer] = useState({ name: '', phone: '', email: '' });

  // Tire Item form (individual tire)
  const [itemFormData, setItemFormData] = useState({
    tirePosition: '',
    treadDepth: '',
    pressure: '',
    damage: '',
    condition: '',
    photoUrl: '',
  });

  // Compose vehicle config (supports up to 2 trailers)
  const vehicleConfig = composeVehicleWithTrailers(vehicleType, trailer1Type, trailer2Type) || {};
  const totalTires = vehicleConfig.allTires?.length || vehicleConfig.vehicle?.tires?.length || 0;

  const DRAFT_KEY = 'zuri-home-inspection-draft';

  // Load draft on mount (after initial surveys fetch)
  React.useEffect(() => {
    if (inspectionSurveys.length === 0) return; // wait for initial load
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.surveyFormData) setSurveyFormData(parsed.surveyFormData);
        if (parsed.vehicleType) setVehicleType(parsed.vehicleType);
        if (parsed.trailer1Type !== undefined) setTrailer1Type(parsed.trailer1Type);
        if (parsed.trailer2Type !== undefined) setTrailer2Type(parsed.trailer2Type);
        if (parsed.tireItems) setTireItems(parsed.tireItems);
        if (parsed.isAddingNewSurvey) setIsAddingNewSurvey(true);
      }
    } catch (e) {
      console.warn('Failed to load Home draft:', e);
    }
  }, [inspectionSurveys]);

  // Auto-save draft
  const saveDraft = () => {
    try {
      const draft = {
        surveyFormData,
        vehicleType,
        trailer1Type,
        trailer2Type,
        tireItems,
        isAddingNewSurvey,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save Home draft:', e);
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

  // Fetch inspection surveys on mount
  useEffect(() => {
    fetchInspectionSurveys();
    fetchCompanies();
    fetchDepots();
    fetchVehicleConfigs();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/companies`, { withCredentials: true });
      setCompanies(res.data || []);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const fetchDepots = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/depots`, { withCredentials: true });
      setDepots(res.data || []);
    } catch (err) {
      console.error('Failed to fetch depots:', err);
    }
  };

  const fetchVehicleConfigs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/vehicle-configs`, { withCredentials: true });
      setVehicleConfigs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch vehicle configs:', err);
    }
  };

  const handleSaveCustomCustomer = () => {
    if (!customCustomer.name) {
      alert('Customer name is required');
      return;
    }
    setSurveyFormData({
      ...surveyFormData,
      customerName: customCustomer.name,
      customerPhone: customCustomer.phone,
      customerEmail: customCustomer.email,
    });
    setShowCustomerModal(false);
    setCustomCustomer({ name: '', phone: '', email: '' });
  };

  const fetchInspectionSurveys = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/inspections`, { withCredentials: true });
      const filtered = filterInspectionsByAccess(response.data);
      setInspectionSurveys(filtered);
      setInspections(filtered);
    } catch (err) {
      console.error('Error fetching inspections:', err);
      setError('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const filterInspectionsByAccess = (inspections) => {
    if (user?.role === 'Administrator' || user?.role === 'Group Manager') {
      return inspections;
    } else if (user?.role === 'Store Manager') {
      return inspections.filter(i => i.store_id === user?.storeId);
    } else {
      return inspections.filter(i => i.user_id === user?.id);
    }
  };

  // Handle survey selection
  const handleSelectSurvey = (survey) => {
    setEditingSurvey(survey);
    setEditingItem(null);
    setIsAddingNewItem(false);
    setSelectedTireId(null);
    setTireItems(survey.items || []);
    setSurveyFormData({
      customerName: survey.customer_name || '',
      customerPhone: survey.customer_phone || '',
      customerEmail: survey.customer_email || '',
      location: survey.location || '',
      inspectionDate: survey.report_date || new Date().toISOString().split('T')[0],
      vehicleId: survey.vehicle_id || '',
      status: survey.status || 'In Progress',
    });
  };

  // Add new survey
  const handleAddNewSurvey = () => {
    setIsAddingNewSurvey(true);
    setEditingSurvey(null);
    setTireItems([]);
    setEditingItem(null);
    setIsAddingNewItem(false);
    setSelectedTireId(null);
    setVehicleType(VEHICLE_TYPES.CAR);
    setTrailer1Type(null);
    setTrailer2Type(null);
    setSurveyFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      location: '',
      inspectionDate: new Date().toISOString().split('T')[0],
      vehicleId: '',
      status: 'In Progress',
    });
  };

  // Save survey (header)
  const handleSaveSurvey = async () => {
    try {
      setError('');

      if (!surveyFormData.customerName || !surveyFormData.location || !surveyFormData.vehicleId) {
        setError('Please fill in required fields (Customer Name, Location, Vehicle ID)');
        return;
      }

      if (tireItems.length === 0) {
        setError('Please add at least one tire item');
        return;
      }

      const surveyData = {
        ...surveyFormData,
        items: tireItems,
        userId: user?.id,
        userName: user?.username,
        storeId: user?.storeId,
        updatedAt: new Date().toISOString(),
      };

      if (editingSurvey?.id) {
        // Update
        await axios.post(`${BASE_URL}/api/inspections`, {
          ...surveyData,
          id: editingSurvey.id,
        }, { withCredentials: true });
      } else {
        // Create
        await axios.post(`${BASE_URL}/api/inspections`, surveyData, { withCredentials: true });
      }

      await fetchInspectionSurveys();
      setIsAddingNewSurvey(false);
      setEditingSurvey(null);
      setTireItems([]);
      setEditingItem(null);
      setIsAddingNewItem(false);
      setSelectedTireId(null);

      // Clear draft after successful submit
      clearDraft();
    } catch (err) {
      console.error('Error saving inspection survey:', err);
      setError(`Failed to save inspection: ${err?.response?.data?.code || err.message}`);
    }
  };

  // Add new tire item
  const handleAddNewItem = () => {
    setIsAddingNewItem(true);
    setEditingItem(null);
    setSelectedTireId(null);
    setItemFormData({
      tirePosition: '',
      treadDepth: '',
      pressure: '',
      damage: '',
      condition: '',
      photoUrl: '',
    });
  };

  // Select tire from grid
  const handleTireSelect = (tireId) => {
    const existingTire = tireItems.find(t => t.tirePosition === tireId);
    if (existingTire) {
      setEditingItem(existingTire);
      setSelectedTireId(tireId);
      setIsAddingNewItem(false);
      setItemFormData(existingTire);
    } else {
      setIsAddingNewItem(true);
      setEditingItem(null);
      setSelectedTireId(tireId);
      setItemFormData({
        tirePosition: tireId,
        treadDepth: '',
        pressure: '',
        damage: '',
        condition: '',
        photoUrl: '',
      });
    }
  };

  // Handle item form changes
  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemFormData({ ...itemFormData, [name]: value });
  };

  // Handle photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload photo
  const uploadPhoto = async () => {
    if (!photoFile) return itemFormData.photoUrl;
    try {
      const uploadData = new FormData();
      uploadData.append('photo', photoFile);
      const res = await axios.post(`${BASE_URL}/upload`, uploadData, {
        withCredentials: true,
      });
      return res.data.path;
    } catch (err) {
      console.error('Photo upload failed:', err);
      return null;
    }
  };

  // Save tire item
  const handleSaveItem = async () => {
    try {
      setError('');

      if (!itemFormData.tirePosition || !itemFormData.treadDepth || !itemFormData.pressure) {
        setError('Please fill in Tire Position, Tread Depth, and Pressure');
        return;
      }

      let photoUrl = itemFormData.photoUrl;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const newItem = {
        ...itemFormData,
        photoUrl: photoUrl,
      };

      const updatedItems = editingItem
        ? tireItems.map(t => (t.tirePosition === editingItem.tirePosition ? newItem : t))
        : [...tireItems, newItem];

      setTireItems(updatedItems);

      // Auto-save draft after tire save
      setTimeout(saveDraft, 100);

      setIsAddingNewItem(false);
      setEditingItem(null);
      setSelectedTireId(null);
      setPhotoFile(null);
      setPhotoPreview('');
      setItemFormData({
        tirePosition: '',
        treadDepth: '',
        pressure: '',
        damage: '',
        condition: '',
        photoUrl: '',
      });
    } catch (err) {
      setError(`Error saving tire item: ${err.message}`);
    }
  };

  // Delete tire item
  const handleDeleteItem = (tirePosition) => {
    setTireItems(tireItems.filter(t => t.tirePosition !== tirePosition));
    if (selectedTireId === tirePosition) {
      setSelectedTireId(null);
      setIsAddingNewItem(false);
      setEditingItem(null);
    }
  };

  // Cancel editing
  const handleCancelSurvey = () => {
    setIsAddingNewSurvey(false);
    setEditingSurvey(null);
    setTireItems([]);
    setEditingItem(null);
    setIsAddingNewItem(false);
    setSelectedTireId(null);
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading surveys...</div>;

  return (
    <div className="flex gap-4 p-6 bg-gray-50 min-h-screen dark:bg-gray-900">
      {/* Left Panel - Survey List (Sidebar) */}
      <div className="w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
          <h2 className="text-xl font-bold">Inspection Surveys</h2>
          <p className="text-blue-100 text-sm">{inspectionSurveys.length} total surveys</p>
          <div className="mt-3 flex gap-2 text-sm">
            <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-100">To Do: {inspectionSurveys.filter(s => (s.status || '').toLowerCase() === 'to do').length}</div>
            <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 rounded-full text-yellow-800 dark:text-yellow-100">In Progress: {inspectionSurveys.filter(s => (s.status || '').toLowerCase() === 'in progress').length}</div>
            <div className="px-2 py-1 bg-green-100 dark:bg-green-800 rounded-full text-green-800 dark:text-green-100">Completed: {inspectionSurveys.filter(s => (s.status || '').toLowerCase() === 'completed').length}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {inspectionSurveys.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No surveys yet</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {inspectionSurveys.map((survey) => {
                const status = (survey.status || '').toLowerCase();
                const badge = status === 'completed' ? 'bg-green-100 text-green-800' : status === 'in progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';
                return (
                  <div
                    key={survey.id}
                    onClick={() => handleSelectSurvey(survey)}
                    className={`p-4 cursor-pointer transition flex items-start justify-between ${
                      editingSurvey?.id === survey.id
                        ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{survey.vehicle_id || survey.vehicleId}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{survey.report_date || survey.inspectionDate}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Customer: {survey.customer_name || survey.customerName}</div>
                    </div>
                    <div className="ml-3 text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${badge}`}>{survey.status || 'To Do'}</div>
                      <div className="text-xs text-gray-400 mt-1">{survey.items?.length || 0} items</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={handleAddNewSurvey}
          className="bg-blue-600 text-white p-4 font-semibold hover:bg-blue-700 transition"
        >
          + New Survey
        </button>
      </div>

      {/* Right Panel - Survey Form & Tire Grid & Items */}
      <div className="w-3/4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-y-auto flex flex-col">
        {isAddingNewSurvey || editingSurvey ? (
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Header Section - Survey Details */}
            <div className="border-l-4 border-blue-500 pl-6 py-4 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900 dark:to-transparent rounded-r-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Survey Details</h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Company *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={surveyFormData.customerName}
                      onChange={(e) => {
                        const company = companies.find(c => c.name === e.target.value);
                        setSurveyFormData({
                          ...surveyFormData,
                          customerName: e.target.value,
                          customerPhone: company?.phone || '',
                          customerEmail: company?.email || '',
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Company</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCustomerModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xl"
                      title="Add Custom Customer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Depot *
                  </label>
                  <select
                    value={surveyFormData.location}
                    onChange={(e) => setSurveyFormData({ ...surveyFormData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Depot</option>
                    {depots.map(d => (
                      <option key={d.id} value={d.location}>{d.location}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle ID *
                  </label>
                  <input
                    type="text"
                    name="vehicleId"
                    value={surveyFormData.vehicleId}
                    onChange={(e) => setSurveyFormData({ ...surveyFormData, vehicleId: e.target.value })}
                    placeholder="e.g., TR-001"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={surveyFormData.customerPhone}
                    onChange={(e) => setSurveyFormData({ ...surveyFormData, customerPhone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={surveyFormData.customerEmail}
                    onChange={(e) => setSurveyFormData({ ...surveyFormData, customerEmail: e.target.value })}
                    placeholder="Email"
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
                    value={surveyFormData.inspectionDate}
                    onChange={(e) => setSurveyFormData({ ...surveyFormData, inspectionDate: e.target.value })}
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
                      Vehicle Config (Searchable by Code)
                    </label>
                    <select
                      value={surveyFormData.vehicleId}
                      onChange={(e) => {
                        const config = vehicleConfigs.find(vc => (vc.item_code || vc.itemCode) === e.target.value);
                        if (config) {
                          setSurveyFormData({ ...surveyFormData, vehicleId: e.target.value });
                          // Could auto-load config here if needed
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Vehicle Config</option>
                      {vehicleConfigs.map(vc => (
                        <option key={vc.id} value={vc.item_code || vc.itemCode}>
                          {vc.item_code || vc.itemCode} - {vc.name}
                          {(vc.tire_config || vc.tireConfig) && ` [${vc.tire_config || vc.tireConfig}]`}
                          {(vc.spares > 0) && ` +${vc.spares}sp`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Or Manual Vehicle Type
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
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
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
                      <option value={VEHICLE_TYPES.TRAILER_2AXLE}>Trailer 2-Axle</option>
                      <option value={VEHICLE_TYPES.TRAILER_3AXLE}>Trailer 3-Axle</option>
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
                      <option value={VEHICLE_TYPES.TRAILER_2AXLE}>Trailer 2-Axle</option>
                      <option value={VEHICLE_TYPES.TRAILER_3AXLE}>Trailer 3-Axle</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Tire Grid Section */}
            <div className="border-l-4 border-green-500 pl-6 py-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900 dark:to-transparent rounded-r-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tire Positions: {tireItems.length} / {totalTires} Inspected
                </h3>
                <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${(tireItems.length / totalTires) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                <div className="space-y-3 max-h-64 overflow-y-auto">
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
                          onClick={() => handleTireSelect(item.tirePosition)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.tirePosition)}
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
            {(isAddingNewItem || editingItem) && selectedTireId && (
              <div className="border-l-4 border-orange-500 pl-6 py-4 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900 dark:to-transparent rounded-r-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingItem ? 'Edit' : 'Add'} Tire: {selectedTireId}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tread Depth (mm) *
                    </label>
                    <input
                      type="number"
                      name="treadDepth"
                      value={itemFormData.treadDepth}
                      onChange={handleItemFormChange}
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
                      value={itemFormData.pressure}
                      onChange={handleItemFormChange}
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
                      value={itemFormData.damage}
                      onChange={handleItemFormChange}
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
                      value={itemFormData.condition}
                      onChange={handleItemFormChange}
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
                  {(photoPreview || itemFormData.photoUrl) && (
                    <img
                      src={photoPreview || `${BASE_URL}${itemFormData.photoUrl}`}
                      alt="Tire"
                      className="mt-3 max-w-xs rounded-lg border"
                    />
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveItem}
                    className="flex-1 bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Save Tire
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNewItem(false);
                      setEditingItem(null);
                      setSelectedTireId(null);
                      setPhotoFile(null);
                      setPhotoPreview('');
                    }}
                    className="flex-1 bg-gray-400 dark:bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-500 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleAddNewItem}
                disabled={tireItems.length >= totalTires}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Tire
              </button>
              <button
                onClick={handleSaveSurvey}
                disabled={tireItems.length === 0}
                className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Save Survey
              </button>
              <button
                onClick={handleCancelSurvey}
                className="flex-1 bg-gray-400 dark:bg-gray-600 text-white font-semibold py-3 rounded-lg hover:bg-gray-500 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-lg">Select a survey or create a new one to begin</p>
          </div>
        )}
      </div>

      {/* Custom Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Custom Customer</h3>
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={customCustomer.name}
                  onChange={(e) => setCustomCustomer({ ...customCustomer, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Phone</label>
                <input
                  type="tel"
                  value={customCustomer.phone}
                  onChange={(e) => setCustomCustomer({ ...customCustomer, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={customCustomer.email}
                  onChange={(e) => setCustomCustomer({ ...customCustomer, email: e.target.value })}
                  placeholder="Email address"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveCustomCustomer}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Add Customer
              </button>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setCustomCustomer({ name: '', phone: '', email: '' });
                }}
                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import DataSuggestionModal from '../DataSuggestionModal';
import InspectionHeader from './InspectionHeader';
import VehicleCard from './VehicleCard';
import Breadcrumb from './Breadcrumb';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function InspectionFormNew({ onSubmit, user, initialData = null }) {
  // Note: rbac may be used in future for permission checking on manual entries
  // const rbac = useRBAC(user);
  const autosaveTimeoutRef = useRef(null);

  // Header data (inspection level)
  const [headerData, setHeaderData] = useState({
    companyId: '',
    depotId: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
  });

  // Multi-vehicle array (max 5)
  const [vehicles, setVehicles] = useState([
    {
      mainVehicle: {
        vehicleId: '',
        configId: '',
        tires: [],
      },
      trailers: [],
    },
  ]);

  // Draft and UI state
  const [draftId, setDraftId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [savingStatus, setSavingStatus] = useState('');
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [breadcrumbPath, setBreadcrumbPath] = useState([
    { label: 'Inspection', id: 'root', clickable: false },
  ]);
  // Note: breadcrumb navigation may be enhanced in future versions

  // Dropdowns
  const [companies, setCompanies] = useState([]);
  const [depots, setDepots] = useState([]);
  const [configurations, setConfigurations] = useState([]);

  // Modals
  const [suggestionModals, setSuggestionModals] = useState({
    company: false,
    depot: false,
    vehicleConfig: false,
  });

  const [manualEntryModals, setManualEntryModals] = useState({
    company: false,
    depot: false,
    vehicleConfig: false,
  });

  const [manualCompanyData, setManualCompanyData] = useState({ name: '', phone: '', email: '' });
  const [manualDepotData, setManualDepotData] = useState({ location: '', region: '' });
  const [manualConfigData, setManualConfigData] = useState({ code: '', positionName: '', tireCount: 4 });

  // Load data on mount
  useEffect(() => {
    loadDropdownData();
    loadDraftIfExists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDropdownData = async () => {
    try {
      const [companiesRes, depotsRes, configRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/table/companies`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/api/table/depots`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/api/table/vehicle-configurations`, { withCredentials: true }).catch(() => ({ data: [] })),
      ]);
      setCompanies(companiesRes.data || []);
      setDepots(depotsRes.data || []);
      setConfigurations(configRes.data || []);
    } catch (err) {
      console.warn('Failed to load dropdown data:', err);
    }
  };

  const loadDraftIfExists = () => {
    try {
      const draft = localStorage.getItem('zuri-inspection-draft-v2');
      if (draft) {
        const parsed = JSON.parse(draft);
        setDraftId(parsed.draftId || Date.now().toString());
        setHeaderData(parsed.headerData || headerData);
        setVehicles(parsed.vehicles || vehicles);
        setLastSaved(parsed.lastSaved);
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
  };

  // Auto-save mechanism
  const scheduleAutosave = () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    setSavingStatus('Saving...');

    autosaveTimeoutRef.current = setTimeout(() => {
      const draft = {
        draftId: draftId || Date.now().toString(),
        headerData,
        vehicles,
        lastSaved: new Date().toISOString(),
      };
      try {
        localStorage.setItem('zuri-inspection-draft-v2', JSON.stringify(draft));
        setLastSaved(draft.lastSaved);
        setSavingStatus('Saved');
        setTimeout(() => setSavingStatus(''), 2000);
      } catch (e) {
        console.warn('Failed to autosave:', e);
        setSavingStatus('Save failed');
      }
    }, 1500);
  };

  const handleHeaderChange = (name, value) => {
    setHeaderData(prev => ({
      ...prev,
      [name]: value,
    }));
    scheduleAutosave();
  };

  const handleVehicleChange = (vehicleIndex, updatedVehicle) => {
    const updatedVehicles = [...vehicles];
    updatedVehicles[vehicleIndex] = updatedVehicle;
    setVehicles(updatedVehicles);
    scheduleAutosave();
  };

  const handleAddVehicle = () => {
    if (vehicles.length < 5) {
      setVehicles([
        ...vehicles,
        {
          mainVehicle: {
            vehicleId: '',
            configId: '',
            tires: [],
          },
          trailers: [],
        },
      ]);
      scheduleAutosave();
    }
  };

  const handleRemoveVehicle = (vehicleIndex) => {
    if (vehicleIndex === 0) return; // Cannot remove first vehicle
    const updatedVehicles = vehicles.filter((_, idx) => idx !== vehicleIndex);
    setVehicles(updatedVehicles);
    scheduleAutosave();
  };

  const handleManualCompanySave = async () => {
    if (!manualCompanyData.name.trim()) {
      setToast({ type: 'error', message: 'Company name is required' });
      return;
    }
    try {
      await axios.post(
        `${BASE_URL}/api/suggestions`,
        {
          type: 'company',
          data: manualCompanyData,
          status: 'pending',
          suggestedBy: user?.username || 'anonymous',
          timestamp: new Date().toISOString(),
        },
        { withCredentials: true }
      ).catch(() => {
        console.warn('Could not submit suggestion to server');
      });

      const newCompany = { id: Date.now(), ...manualCompanyData, status: 'unvetted' };
      setCompanies([...companies, newCompany]);
      setHeaderData(prev => ({
        ...prev,
        companyId: newCompany.id,
      }));

      setManualCompanyData({ name: '', phone: '', email: '' });
      setManualEntryModals(prev => ({ ...prev, company: false }));
      setToast({ type: 'success', message: 'Company added and pending admin review' });
      scheduleAutosave();
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
      await axios.post(
        `${BASE_URL}/api/suggestions`,
        {
          type: 'depot',
          data: manualDepotData,
          status: 'pending',
          suggestedBy: user?.username || 'anonymous',
          timestamp: new Date().toISOString(),
        },
        { withCredentials: true }
      ).catch(() => {
        console.warn('Could not submit suggestion to server');
      });

      const newDepot = { id: Date.now(), ...manualDepotData, status: 'unvetted' };
      setDepots([...depots, newDepot]);
      setHeaderData(prev => ({
        ...prev,
        depotId: newDepot.id,
      }));

      setManualDepotData({ location: '', region: '' });
      setManualEntryModals(prev => ({ ...prev, depot: false }));
      setToast({ type: 'success', message: 'Depot added and pending admin review' });
      scheduleAutosave();
    } catch (err) {
      setToast({ type: 'error', message: `Error adding depot: ${err.message}` });
    }
  };

  const handleManualConfigSave = async () => {
    if (!manualConfigData.code.trim() || !manualConfigData.positionName.trim()) {
      setToast({ type: 'error', message: 'Code and Position Name are required' });
      return;
    }
    try {
      await axios.post(
        `${BASE_URL}/api/suggestions`,
        {
          type: 'vehicleConfig',
          data: manualConfigData,
          status: 'pending',
          suggestedBy: user?.username || 'anonymous',
          timestamp: new Date().toISOString(),
        },
        { withCredentials: true }
      ).catch(() => {
        console.warn('Could not submit suggestion to server');
      });

      const newConfig = { id: Date.now(), ...manualConfigData, status: 'unvetted' };
      setConfigurations([...configurations, newConfig]);
      setToast({ type: 'success', message: 'Configuration added and pending admin review' });
      setManualConfigData({ code: '', positionName: '', tireCount: 4 });
      setManualEntryModals(prev => ({ ...prev, vehicleConfig: false }));
      scheduleAutosave();
    } catch (err) {
      setToast({ type: 'error', message: `Error adding configuration: ${err.message}` });
    }
  };

  const validateForm = () => {
    setError('');

    // Validate header
    if (!headerData.companyId) {
      setError('Please select a Company');
      return false;
    }
    if (!headerData.depotId) {
      setError('Please select a Depot');
      return false;
    }
    if (!headerData.date) {
      setError('Please select a Date');
      return false;
    }
    if (!headerData.location.trim()) {
      setError('Please enter a Location');
      return false;
    }

    // Validate vehicles
    if (vehicles.length === 0) {
      setError('At least one vehicle is required');
      return false;
    }

    for (let vIdx = 0; vIdx < vehicles.length; vIdx++) {
      const v = vehicles[vIdx];

      // Main vehicle
      if (!v.mainVehicle.vehicleId.trim()) {
        setError(`Vehicle ${vIdx + 1}: Main vehicle ID is required`);
        return false;
      }
      if (!v.mainVehicle.configId) {
        setError(`Vehicle ${vIdx + 1}: Configuration is required`);
        return false;
      }
      if (v.mainVehicle.tires.length === 0) {
        setError(`Vehicle ${vIdx + 1}: At least one tire must be inspected`);
        return false;
      }

      // Check for depth readings
      const mainHasValidDepth = v.mainVehicle.tires.some(
        t => (t.depthInner || t.depthInner === 0) && 
             (t.depthMiddle || t.depthMiddle === 0) && 
             (t.depthOuter || t.depthOuter === 0)
      );
      if (!mainHasValidDepth) {
        setError(`Vehicle ${vIdx + 1}: At least one main tire must have all three depth readings (Inner, Middle, Outer)`);
        return false;
      }

      // Trailers
      for (let tIdx = 0; tIdx < (v.trailers || []).length; tIdx++) {
        const t = v.trailers[tIdx];
        if (!t.trailerId.trim()) {
          setError(`Vehicle ${vIdx + 1}, Trailer ${tIdx + 1}: Trailer ID is required`);
          return false;
        }
        if (!t.configId) {
          setError(`Vehicle ${vIdx + 1}, Trailer ${tIdx + 1}: Configuration is required`);
          return false;
        }
        if (t.tires.length === 0) {
          setError(`Vehicle ${vIdx + 1}, Trailer ${tIdx + 1}: At least one tire must be inspected`);
          return false;
        }

        const trailerHasValidDepth = t.tires.some(
          tr => (tr.depthInner || tr.depthInner === 0) && 
                 (tr.depthMiddle || tr.depthMiddle === 0) && 
                 (tr.depthOuter || tr.depthOuter === 0)
        );
        if (!trailerHasValidDepth) {
          setError(`Vehicle ${vIdx + 1}, Trailer ${tIdx + 1}: At least one tire must have all three depth readings`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        header: headerData,
        vehicles,
        timestamp: new Date().toISOString(),
      };

      if (navigator.onLine) {
        await axios.post(`${BASE_URL}/api/inspections`, payload, { withCredentials: true });
        setToast({ type: 'success', message: 'Inspection submitted successfully!' });
      } else {
        // Save offline
        const pending = JSON.parse(localStorage.getItem('zuri-pending') || '[]');
        pending.push(payload);
        localStorage.setItem('zuri-pending', JSON.stringify(pending));
        setToast({ type: 'success', message: 'Saved offline. Will sync when back online.' });
      }

      // Clear draft
      localStorage.removeItem('zuri-inspection-draft-v2');
      setTimeout(() => {
        if (onSubmit) onSubmit();
      }, 1500);
    } catch (err) {
      setError(`Error submitting inspection: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Breadcrumb */}
      <Breadcrumb path={breadcrumbPath} onNavigate={() => {}} />

      {/* Main Form Container */}
      <div className="max-w-6xl mx-auto mt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Bar */}
          <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {savingStatus && (
                <>
                  {savingStatus}
                  {lastSaved && savingStatus === 'Saved' && (
                    <> • Last saved: {new Date(lastSaved).toLocaleTimeString()}</>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {vehicles.length} / 5 Inspections
              </span>
              <button
                type="button"
                onClick={handleAddVehicle}
                disabled={vehicles.length >= 5}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
              >
                ➕ Add Inspection
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Inspection Header */}
          <InspectionHeader
            headerData={headerData}
            companies={companies}
            depots={depots}
            onHeaderChange={(name, value) => handleHeaderChange(name, value)}
            onManualCompanyAdd={() => setManualEntryModals(prev => ({ ...prev, company: true }))}
            onManualDepotAdd={() => setManualEntryModals(prev => ({ ...prev, depot: true }))}
            user={user}
          />

          {/* Vehicle Cards */}
          <div className="space-y-4">
            {vehicles.map((vehicle, idx) => (
              <VehicleCard
                key={idx}
                vehicleIndex={idx}
                vehicle={vehicle}
                configurations={configurations}
                onVehicleChange={(updated) => handleVehicleChange(idx, updated)}
                onRemoveVehicle={handleRemoveVehicle}
                onManualConfigAdd={() => setManualEntryModals(prev => ({ ...prev, vehicleConfig: true }))}
                showConfigSuggestionModal={() => setSuggestionModals(prev => ({ ...prev, vehicleConfig: true }))}
              />
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-300 dark:border-gray-600">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              ✓ Submit Inspection
            </button>
            <button
              type="reset"
              className="px-6 py-3 bg-gray-400 dark:bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Manual Entry Modals */}
      {manualEntryModals.company && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">✎ Add Company</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={manualCompanyData.name}
                onChange={(e) => setManualCompanyData({ ...manualCompanyData, name: e.target.value })}
                placeholder="Company Name *"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="tel"
                value={manualCompanyData.phone}
                onChange={(e) => setManualCompanyData({ ...manualCompanyData, phone: e.target.value })}
                placeholder="Phone"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="email"
                value={manualCompanyData.email}
                onChange={(e) => setManualCompanyData({ ...manualCompanyData, email: e.target.value })}
                placeholder="Email"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleManualCompanySave}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualEntryModals(prev => ({ ...prev, company: false }));
                  setManualCompanyData({ name: '', phone: '', email: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
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
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">✎ Add Depot</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={manualDepotData.location}
                onChange={(e) => setManualDepotData({ ...manualDepotData, location: e.target.value })}
                placeholder="Depot Location *"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                value={manualDepotData.region}
                onChange={(e) => setManualDepotData({ ...manualDepotData, region: e.target.value })}
                placeholder="Region (Optional)"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleManualDepotSave}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualEntryModals(prev => ({ ...prev, depot: false }));
                  setManualDepotData({ location: '', region: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {manualEntryModals.vehicleConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">✎ Add Configuration</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={manualConfigData.code}
                onChange={(e) => setManualConfigData({ ...manualConfigData, code: e.target.value })}
                placeholder="Configuration Code *"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                value={manualConfigData.positionName}
                onChange={(e) => setManualConfigData({ ...manualConfigData, positionName: e.target.value })}
                placeholder="Position Name (e.g., 'Pos.1 - Steer') *"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="number"
                value={manualConfigData.tireCount}
                onChange={(e) => setManualConfigData({ ...manualConfigData, tireCount: parseInt(e.target.value) })}
                placeholder="Number of Tires"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleManualConfigSave}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualEntryModals(prev => ({ ...prev, vehicleConfig: false }));
                  setManualConfigData({ code: '', positionName: '', tireCount: 4 });
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Modals */}
      <DataSuggestionModal
        isOpen={suggestionModals.vehicleConfig}
        onClose={() => setSuggestionModals(prev => ({ ...prev, vehicleConfig: false }))}
        suggestionType="vehicleConfig"
        user={user}
        onSuccess={() => {
          loadDropdownData();
        }}
      />
    </div>
  );
}

export default InspectionFormNew;

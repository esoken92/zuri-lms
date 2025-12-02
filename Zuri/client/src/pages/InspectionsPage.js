import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InspectionForm from '../components/InspectionForm';
import Toast from '../components/Toast';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function InspectionsPage({ user }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingInspection, setEditingInspection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Load inspections on mount
  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${BASE_URL}/api/inspections`, { withCredentials: true });
      
      // Filter based on user role
      const filtered = filterByUserRole(response.data || []);
      
      // Remove duplicates based on inspection ID
      const unique = Array.from(new Map(filtered.map(item => [item.id, item])).values());
      
      setInspections(unique);
    } catch (err) {
      console.error('Error fetching inspections:', err);
      setError('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const filterByUserRole = (data) => {
    if (user?.role === 'Administrator' || user?.role === 'Group Manager') {
      return data;
    } else if (user?.role === 'Store Manager') {
      return data.filter(i => i.store_id === user?.storeId);
    } else {
      return data.filter(i => i.user_id === user?.id);
    }
  };

  const handleNewInspection = () => {
    setEditingInspection(null);
    setView('form');
  };

  const handleEditInspection = (inspection) => {
    setEditingInspection(inspection);
    setView('form');
  };

  const handleFormSubmit = async () => {
    setToast({ type: 'success', message: 'Inspection saved successfully!' });
    await fetchInspections();
    setView('list');
    setEditingInspection(null);
  };

  const handleDeleteInspection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inspection?')) return;

    try {
      await axios.delete(`${BASE_URL}/api/inspections/${id}`, { withCredentials: true });
      setToast({ type: 'success', message: 'Inspection deleted' });
      await fetchInspections();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete inspection' });
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = 
      !searchTerm ||
      inspection.vehicle_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ||
      (inspection.status || '').toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'in progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'to do': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return statusMap[(status || 'to do').toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading && view === 'list') {
    return <div className="p-6 text-center text-gray-500">Loading inspections...</div>;
  }

  if (view === 'form') {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <button
          onClick={() => {
            setView('list');
            setEditingInspection(null);
          }}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          ← Back to Inspections
        </button>
        <InspectionForm
          user={user}
          initialData={editingInspection}
          onSubmit={handleFormSubmit}
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {toast && (
        <Toast type={toast.type} message={toast.message} />
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tire Inspections
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view tire inspection surveys
          </p>
        </div>
        <button
          onClick={handleNewInspection}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
        >
          + New Inspection
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by vehicle ID, customer, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="to do">To Do</option>
          <option value="in progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="text-sm font-semibold text-blue-600 dark:text-blue-300">Total</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{inspections.length}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-300">In Progress</div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
            {inspections.filter(i => (i.status || '').toLowerCase() === 'in progress').length}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-sm font-semibold text-green-600 dark:text-green-300">Completed</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {inspections.filter(i => (i.status || '').toLowerCase() === 'completed').length}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Items</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {inspections.reduce((sum, i) => sum + (i.items?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Inspections List */}
      {filteredInspections.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {inspections.length === 0 ? 'No inspections yet' : 'No inspections match your search'}
          </p>
          {inspections.length === 0 && (
            <button
              onClick={handleNewInspection}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create your first inspection
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredInspections.map((inspection) => (
            <div
              key={inspection.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {inspection.vehicle_id || 'Unknown Vehicle'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {inspection.customer_name || 'No Customer'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(inspection.status)}`}>
                  {inspection.status || 'To Do'}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{inspection.location || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {inspection.report_date 
                      ? new Date(inspection.report_date).toLocaleDateString() 
                      : inspection.inspection_date 
                      ? new Date(inspection.inspection_date).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{inspection.items?.length || 0} tires</span>
                </div>
                <div className="flex justify-between">
                  <span>By:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{inspection.user_name || 'Unknown User'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEditInspection(inspection)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteInspection(inspection.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                  Delete
                </button>
                {inspection.items?.length > 0 && (
                  <button
                    onClick={() => setToast({ 
                      type: 'info', 
                      message: `Inspection contains ${inspection.items.length} tire(s)` 
                    })}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                  >
                    View Items
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InspectionsPage;

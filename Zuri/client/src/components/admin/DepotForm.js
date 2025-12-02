import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DepotForm() {
  const [depots, setDepots] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    location: '',
    contactName: '',
    email: '',
    phone: '',
    companyId: '',
  });

  useEffect(() => {
    fetchDepots();
    fetchCompanies();
  }, []);

  const fetchDepots = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/depots`, { withCredentials: true });
      setDepots(res.data || []);
    } catch (err) {
      console.error('Failed to fetch depots:', err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/companies`, { withCredentials: true });
      setCompanies(res.data || []);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.location || !formData.companyId) {
        alert('Location and Company are required');
        return;
      }

      if (editing) {
        await axios.put(`${BASE_URL}/api/depots/${editing.id}`, formData, { withCredentials: true });
      } else {
        await axios.post(`${BASE_URL}/api/depots`, formData, { withCredentials: true });
      }

      await fetchDepots();
      handleCancel();
    } catch (err) {
      console.error('Failed to save depot:', err);
      alert('Failed to save depot');
    }
  };

  const handleEdit = (depot) => {
    setEditing(depot);
    setFormData({
      location: depot.location || '',
      contactName: depot.contact_name || depot.contactName || '',
      email: depot.email || '',
      phone: depot.phone || '',
      companyId: depot.company_id || depot.companyId || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this depot?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/depots/${id}`, { withCredentials: true });
      await fetchDepots();
    } catch (err) {
      console.error('Failed to delete depot:', err);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      location: '',
      contactName: '',
      email: '',
      phone: '',
      companyId: '',
    });
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId || c.id === parseInt(companyId));
    return company?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">{editing ? 'Edit' : 'New'} Depot</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-2">Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter depot location"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Company *</label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select Company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2">Contact Name</label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="Enter contact person"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="depot@example.com"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">
            Save Depot
          </button>
          {editing && (
            <button onClick={handleCancel} className="px-4 py-2 bg-gray-400 text-white rounded">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Depots</h2>
        <div className="space-y-2">
          {depots.length === 0 ? (
            <p className="text-gray-500">No depots yet</p>
          ) : (
            depots.map(depot => (
              <div key={depot.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-bold">{depot.location}</div>
                  <div className="text-sm text-gray-600">
                    Company: {getCompanyName(depot.company_id || depot.companyId)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Contact: {depot.contact_name || depot.contactName || 'N/A'}
                    {depot.phone && ` | ${depot.phone}`}
                    {depot.email && ` | ${depot.email}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(depot)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(depot.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">
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

export default DepotForm;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CompanyForm() {
  const [companies, setCompanies] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

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
      if (!formData.name) {
        alert('Company name is required');
        return;
      }

      if (editing) {
        await axios.put(`${BASE_URL}/api/companies/${editing.id}`, formData, { withCredentials: true });
      } else {
        await axios.post(`${BASE_URL}/api/companies`, formData, { withCredentials: true });
      }

      await fetchCompanies();
      handleCancel();
    } catch (err) {
      console.error('Failed to save company:', err);
      alert('Failed to save company');
    }
  };

  const handleEdit = (company) => {
    setEditing(company);
    setFormData({
      name: company.name || '',
      contactName: company.contact_name || company.contactName || '',
      email: company.email || '',
      phone: company.phone || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/companies/${id}`, { withCredentials: true });
      await fetchCompanies();
    } catch (err) {
      console.error('Failed to delete company:', err);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      name: '',
      contactName: '',
      email: '',
      phone: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">{editing ? 'Edit' : 'New'} Company</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-2">Company Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter company name"
              className="w-full px-3 py-2 border rounded"
            />
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
              placeholder="company@example.com"
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
            Save Company
          </button>
          {editing && (
            <button onClick={handleCancel} className="px-4 py-2 bg-gray-400 text-white rounded">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Companies</h2>
        <div className="space-y-2">
          {companies.length === 0 ? (
            <p className="text-gray-500">No companies yet</p>
          ) : (
            companies.map(company => (
              <div key={company.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-bold">{company.name}</div>
                  <div className="text-sm text-gray-600">
                    Contact: {company.contact_name || company.contactName || 'N/A'}
                    {company.phone && ` | ${company.phone}`}
                    {company.email && ` | ${company.email}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(company)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(company.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">
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

export default CompanyForm;

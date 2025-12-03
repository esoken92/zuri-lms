import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Theme colors - consistent across app
const THEME = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  secondary: 'bg-gray-500 hover:bg-gray-600',
  success: 'bg-green-600 hover:bg-green-700',
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-orange-600 hover:bg-orange-700',
  info: 'bg-cyan-600 hover:bg-cyan-700',
};

function ScrapDataPanel() {
  const [scrapData, setScrapData] = useState([]);
  const [editingScrapId, setEditingScrapId] = useState(null);
  const [editingScrapData, setEditingScrapData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newScrapData, setNewScrapData] = useState({ location: '', damage_code: '', damage_description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 50;

  // Load scrap data from API on mount
  useEffect(() => {
    console.log('[ScrapDataPanel] Component mounted, fetching data...');
    fetchScrapData();
  }, []);

  const fetchScrapData = async () => {
    try {
      setLoading(true);
      console.log('[ScrapDataPanel] Fetching from:', `${BASE_URL}/api/table/scrap-data`);
      const res = await axios.get(`${BASE_URL}/api/table/scrap-data`, { withCredentials: true });
      console.log('[ScrapDataPanel] Received data:', res.data);
      setScrapData(res.data || []);
      setError('');
    } catch (err) {
      console.error('[ScrapDataPanel] API Error:', err);
      if (err.response?.status === 401) {
        setError('Authentication required: Please log in to access scrap data');
      } else if (err.response?.status === 403) {
        setError('Permission denied: Admin access required to manage scrap data');
      } else {
        setError('Failed to load scrap data: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScrapData = async () => {
    if (!newScrapData.location || !newScrapData.damage_code || !newScrapData.damage_description) {
      setError('All fields are required');
      console.log('[ScrapDataPanel] Validation failed:', newScrapData);
      return;
    }

    try {
      setLoading(true);
      console.log('[ScrapDataPanel] Posting data:', newScrapData);
      const response = await axios.post(`${BASE_URL}/api/table/scrap-data`, newScrapData, { withCredentials: true });
      console.log('[ScrapDataPanel] Post successful:', response.data);
      setSuccess('Scrap data created successfully');
      setNewScrapData({ location: '', damage_code: '', damage_description: '' });
      setShowNewForm(false);
      await fetchScrapData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('[ScrapDataPanel] Post failed:', err);
      const errorMsg = err.response?.data?.error || err.message;
      console.error('[ScrapDataPanel] Error message:', errorMsg);
      setError('Failed to create scrap data: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditScrapData = (scrapItem) => {
    setEditingScrapId(scrapItem.id);
    setEditingScrapData({ ...scrapItem });
  };

  const handleUpdateScrapData = async () => {
    try {
      setLoading(true);
      await axios.put(`${BASE_URL}/api/table/scrap-data/${editingScrapId}`, editingScrapData, { withCredentials: true });
      setSuccess('Scrap data updated successfully');
      setEditingScrapId(null);
      await fetchScrapData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update scrap data: ' + err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScrapData = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scrap data?')) return;

    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/api/table/scrap-data/${id}`, { withCredentials: true });
      setSuccess('Scrap data deleted successfully');
      await fetchScrapData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete scrap data: ' + err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredScrapData = scrapData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.damage_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.damage_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterLocation || item.location === filterLocation;
    
    return matchesSearch && matchesFilter;
  });

  const sortedScrapData = [...filteredScrapData].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle numeric fields
    if (typeof aVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Handle string fields
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();
    
    if (sortOrder === 'asc') {
      return aVal.localeCompare(bVal);
    } else {
      return bVal.localeCompare(aVal);
    }
  });

  // Pagination calculation
  const totalPages = Math.ceil(sortedScrapData.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedScrapData = sortedScrapData.slice(startIndex, endIndex);

  const uniqueLocations = [...new Set(scrapData.map(item => item.location))].sort();

  return (
    <div className="p-6">
      {/* Alert Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by location, code, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded"
        />
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="">All Locations</option>
          {uniqueLocations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className={`text-white px-4 py-2 rounded font-semibold ${THEME.success}`}
        >
          {showNewForm ? 'Cancel' : '+ New Entry'}
        </button>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-4 mb-4 bg-gray-50 p-4 rounded border border-gray-200 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700">Sort by:</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded bg-white"
            >
              <option value="id">ID</option>
              <option value="location">Location</option>
              <option value="damage_code">Code</option>
              <option value="damage_description">Description</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700">Order:</label>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`px-4 py-2 rounded font-semibold transition ${
                sortOrder === 'asc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-purple-600 text-white'
              }`}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>
        <button
          onClick={fetchScrapData}
          disabled={loading}
          className={`text-white px-4 py-2 rounded font-semibold disabled:opacity-50 flex items-center gap-2 ${THEME.info}`}
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* New Entry Form */}
      {showNewForm && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-300 rounded">
          <h3 className="font-semibold mb-3">Add New Damage Classification</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Location"
              value={newScrapData.location}
              onChange={(e) => setNewScrapData({ ...newScrapData, location: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Damage Code"
              value={newScrapData.damage_code}
              onChange={(e) => setNewScrapData({ ...newScrapData, damage_code: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Description"
              value={newScrapData.damage_description}
              onChange={(e) => setNewScrapData({ ...newScrapData, damage_description: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={handleCreateScrapData}
            disabled={loading}
            className={`text-white px-4 py-2 rounded font-semibold disabled:opacity-50 ${THEME.success}`}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      {/* Scrap Data Table */}
      {loading && (
        <div className="text-center py-8 text-gray-600">
          <div>Loading damage classifications...</div>
          <div className="text-sm mt-2">(BASE_URL: {BASE_URL})</div>
        </div>
      )}
      
      {!loading && scrapData.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 border border-gray-200 rounded">
          <div>No damage classifications found</div>
          <div className="text-sm mt-2">Click "+ New Entry" to add one</div>
        </div>
      )}

      {!loading && scrapData.length > 0 && (
        <div className="overflow-x-auto border border-gray-300 rounded max-h-[600px]">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-medium">ID</th>
                <th className="px-4 py-2 text-left font-medium">Location</th>
                <th className="px-4 py-2 text-left font-medium">Code</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
                <th className="px-4 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedScrapData.map((item) => (
                <tr key={item.id} className="odd:bg-white even:bg-gray-50 border-t">
                  <td className="px-4 py-2">{item.id}</td>
                  {editingScrapId === item.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editingScrapData.location}
                          onChange={(e) => setEditingScrapData({ ...editingScrapData, location: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editingScrapData.damage_code}
                          onChange={(e) => setEditingScrapData({ ...editingScrapData, damage_code: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editingScrapData.damage_description}
                          onChange={(e) => setEditingScrapData({ ...editingScrapData, damage_description: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{item.location}</td>
                      <td className="px-4 py-2">{item.damage_code}</td>
                      <td className="px-4 py-2">{item.damage_description}</td>
                    </>
                  )}
                  <td className="px-4 py-2">
                    {editingScrapId === item.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateScrapData}
                          disabled={loading}
                          className={`text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50 ${THEME.success}`}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingScrapId(null)}
                          className={`text-white px-3 py-1 rounded text-xs font-semibold ${THEME.secondary}`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditScrapData(item)}
                          className={`text-white px-3 py-1 rounded text-xs font-semibold ${THEME.primary}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteScrapData(item.id)}
                          className={`text-white px-3 py-1 rounded text-xs font-semibold ${THEME.danger}`}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && scrapData.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-gray-600">
            Showing {sortedScrapData.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, sortedScrapData.length)} of {sortedScrapData.length} entries (Sorted by {sortField} - {sortOrder === 'asc' ? 'ascending' : 'descending'})
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${THEME.secondary}`}
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded font-semibold ${
                  currentPage === page
                    ? `text-white ${THEME.primary}`
                    : 'border hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${THEME.secondary}`}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {!loading && scrapData.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          Page {currentPage} of {totalPages} | {scrapData.length} total entries
        </div>
      )}
    </div>
  );
}

export default ScrapDataPanel;

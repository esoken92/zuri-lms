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

function AdminPanel() {
  // Tire Data Management State
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTireEntry, setNewTireEntry] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const ROWS_PER_PAGE = 50;

  // Column order - required fields first, exact names from CSV
  const columnOrder = ['id', 'brand', 'pattern', 'Nominal Section Width', 'Aspect Ratio', 'Rim Size', 'Ply Rating', 'Original Tread Depth', 'Load Rating', 'Load Rating Duals', 'Load Rating Singles', 'Speed Rating Duals', 'Speed Rating Singles', 'Tube Rating', 'Product Code'];

  // Load tire data from API on mount
  useEffect(() => {
    console.log('[AdminPanel] Component mounted, fetching tyre data...');
    fetchTyreData();
  }, []);

  const fetchTyreData = async () => {
    try {
      setLoading(true);
      console.log('[AdminPanel] Fetching from:', `${BASE_URL}/api/table/tyres`);
      const res = await axios.get(`${BASE_URL}/api/table/tyres`, { withCredentials: true });
      console.log('[AdminPanel] Received data:', res.data);
      
      setData(res.data);
      
      // Set headers in specific order
      if (res.data.length > 0) {
        const allHeaders = Object.keys(res.data[0]);
        const orderedHeaders = columnOrder.filter(h => allHeaders.includes(h))
          .concat(allHeaders.filter(h => !columnOrder.includes(h)));
        setHeaders(orderedHeaders);
        initializeNewTireEntry(orderedHeaders);
      }
      setError('');
    } catch (err) {
      console.error('[AdminPanel] API Error:', err);
      if (err.response?.status === 401) {
        setError('Authentication required: Please log in to access tyre data');
      } else if (err.response?.status === 403) {
        setError('Permission denied: Admin access required to manage tyre data');
      } else {
        setError('Failed to load tyre data: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeNewTireEntry = (headerList) => {
    const entry = {};
    headerList.forEach(h => { entry[h] = ''; });
    setNewTireEntry(entry);
  };

  const refreshData = () => {
    fetchTyreData();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const lines = evt.target.result.split('\n').filter(Boolean);
        const csvHeaders = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          return Object.fromEntries(csvHeaders.map((h, i) => [h, values[i] || '']));
        });
        
        for (const row of rows) {
          try {
            await axios.post(`${BASE_URL}/api/table/tyres`, row, { withCredentials: true });
          } catch (err) {
            if (err.response?.status !== 409) {
              throw err;
            }
          }
        }
        
        setSuccess(`Successfully imported ${rows.length} additional tyre records`);
        await fetchTyreData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to import tyre data: ' + (err.response?.data?.error || err.message));
      }
    };

    if (file) reader.readAsText(file);
  };

  const handleCellChange = (header, value) => {
    setEditingData({
      ...editingData,
      [header]: value
    });
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await axios.put(`${BASE_URL}/api/table/tyres/${editingId}`, editingData, { withCredentials: true });
      setSuccess('Tyre data updated successfully');
      setEditingId(null);
      await fetchTyreData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update tyre: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewTire = async () => {
    // Check if required fields are filled (brand, pattern, Nominal Section Width, Aspect Ratio, Rim Size)
    const requiredFields = ['brand', 'pattern', 'Nominal Section Width', 'Aspect Ratio', 'Rim Size'];
    if (requiredFields.some(field => !newTireEntry[field] || newTireEntry[field].trim() === '')) {
      setError('All required fields must be filled');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/api/table/tyres`, newTireEntry, { withCredentials: true });
      
      initializeNewTireEntry(headers);
      setShowAddForm(false);
      setSuccess('New tyre entry added successfully');
      await fetchTyreData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('This tyre already exists in the database');
      } else {
        setError('Failed to add tyre: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleColumnFilterChange = (header, value) => {
    setColumnFilters({
      ...columnFilters,
      [header]: value
    });
    setCurrentPage(1);
  };

  const handleDeleteTire = async (tireId, brand, pattern) => {
    if (!window.confirm(`Delete tyre: ${brand} ${pattern}?`)) return;
    
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/api/table/tyres/${tireId}`, { withCredentials: true });
      setSuccess('Tyre deleted successfully');
      await fetchTyreData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete tyre: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedData = () => {
    // Apply global search term
    let filtered = data.filter(row => {
      if (!searchTerm) return true;
      return headers.some(header => 
        String(row[header] || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Apply column-specific filters
    filtered = filtered.filter(row => {
      return Object.keys(columnFilters).every(header => {
        if (!columnFilters[header]) return true;
        return String(row[header] || '').toLowerCase().includes(columnFilters[header].toLowerCase());
      });
    });

    // Sort
    let sorted = [...filtered].sort((a, b) => {
      if (!sortField) return 0;

      let aVal = a[sortField];
      let bVal = b[sortField];

      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }

      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
      
      if (sortOrder === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    return sorted;
  };

  const sortedAndFilteredData = getFilteredAndSortedData();
  const totalPages = Math.ceil(sortedAndFilteredData.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedData = sortedAndFilteredData.slice(startIndex, endIndex);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full">
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Controls Section */}
      <div className="mb-6 space-y-3">
        {/* Import Section */}
        <div>
          <label className="text-gray-700 font-semibold mb-2 block">Import additional data (CSV)</label>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="block border rounded px-3 py-2 w-full" />
        </div>

        {/* Search and Sort Controls */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search tires..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-48 border rounded px-3 py-2"
          />
          <button 
            onClick={refreshData}
            className={`text-white px-4 py-2 rounded font-semibold ${THEME.info}`}
            title="Refresh tire data"
          >
            🔄 Refresh
          </button>
          <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Sort by...</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`text-white px-3 py-2 rounded font-semibold ${THEME.secondary}`}
          >
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className={`text-white px-4 py-2 rounded font-semibold ${THEME.success}`}
          >
            + Add Entry
          </button>
        </div>
      </div>

      {/* Add Entry Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Add New Tire Entry</h3>
            
            {/* Required Fields Section */}
            <div className="mb-6 pb-4 border-b-2 border-blue-200">
              <h4 className="text-lg font-semibold text-blue-600 mb-3">Required Fields</h4>
              <div className="grid grid-cols-2 gap-4">
                {['brand', 'pattern', 'Nominal Section Width', 'Aspect Ratio', 'Rim Size'].map(header => (
                  <div key={header}>
                    <label className="block text-sm font-semibold mb-1">{header} *</label>
                    <input
                      type="text"
                      value={newTireEntry[header] || ''}
                      onChange={(e) => setNewTireEntry({ ...newTireEntry, [header]: e.target.value })}
                      className="w-full border-2 border-blue-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      placeholder={`Enter ${header}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-600 mb-3">Optional Fields</h4>
              <div className="grid grid-cols-2 gap-4">
                {headers.filter(h => !['id', 'brand', 'pattern', 'Nominal Section Width', 'Aspect Ratio', 'Rim Size'].includes(h)).map(header => (
                  <div key={header}>
                    <label className="block text-sm font-semibold mb-1">{header}</label>
                    <input
                      type="text"
                      value={newTireEntry[header] || ''}
                      onChange={(e) => setNewTireEntry({ ...newTireEntry, [header]: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder={`Enter ${header}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAddForm(false)}
                className={`text-white px-4 py-2 rounded font-semibold ${THEME.secondary}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewTire}
                className={`text-white px-4 py-2 rounded font-semibold ${THEME.success}`}
                disabled={loading}
              >
                Add Tire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      {headers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* Header Row */}
              <tr className="bg-gray-100">
                {headers.map(h => (
                  <th key={h} className="border p-3 text-left font-semibold min-w-32">{h}</th>
                ))}
                <th className="border p-3 text-left font-semibold min-w-20">Actions</th>
              </tr>
              
              {/* Filter Row */}
              <tr className="bg-gray-50">
                {headers.map(h => (
                  <th key={`filter-${h}`} className="border p-3">
                    <input
                      type="text"
                      placeholder={`Filter ${h}...`}
                      value={columnFilters[h] || ''}
                      onChange={(e) => handleColumnFilterChange(h, e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </th>
                ))}
                <th className="border p-3"></th>
              </tr>
            </thead>
            
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={headers.length + 1} className="border p-4 text-center text-gray-600">
                    Loading tyre data...
                  </td>
                </tr>
              )}
              {!loading && paginatedData.length === 0 && (
                <tr>
                  <td colSpan={headers.length + 1} className="border p-4 text-center text-gray-500">
                    No tyres found. Click "+ Add Entry" to add one.
                  </td>
                </tr>
              )}
              {paginatedData.map((row, idx) => (
                <tr key={`${currentPage}-${idx}`} className={`${editingId === row.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  {headers.map(h => (
                    <td key={h} className="border p-3">
                      {editingId === row.id ? (
                        <input
                          type="text"
                          value={editingData[h] || ''}
                          onChange={(e) => handleCellChange(h, e.target.value)}
                          className="w-full border-2 border-blue-300 rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <span className="text-gray-700">{row[h] || ''}</span>
                      )}
                    </td>
                  ))}
                  <td className="border p-3 whitespace-nowrap">
                    {editingId === row.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className={`text-white px-2 py-1 rounded text-sm font-semibold ${THEME.success}`}
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className={`text-white px-2 py-1 rounded text-sm font-semibold ${THEME.secondary}`}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(row.id);
                            setEditingData({ ...row });
                          }}
                          className={`text-white px-2 py-1 rounded text-sm font-semibold ${THEME.primary}`}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTire(row.id, row.brand, row.pattern)}
                          className={`text-white px-2 py-1 rounded text-sm font-semibold ${THEME.danger}`}
                          disabled={loading}
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

          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-gray-600">
              Showing {sortedAndFilteredData.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, sortedAndFilteredData.length)} of {sortedAndFilteredData.length} entries
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'border hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages} | {data.length} total entries
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;

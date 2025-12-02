import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ScrapPage({ user }) {
  // Scrap Reports (header level) - customer info
  const [scrapReports, setScrapReports] = useState([]);
  const [editingReport, setEditingReport] = useState(null);
  const [isAddingNewReport, setIsAddingNewReport] = useState(false);

  // Scrap Items (line items) - individual tire entries
  const [scrapItems, setScrapItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [tiresDatabase, setTiresDatabase] = useState([]);

  // Scrap Report (header) form
  const [reportFormData, setReportFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    location: '',
    reportDate: new Date().toISOString().split('T')[0],
    status: 'In Progress',
  });

  // Scrap Item form (individual tire)
  const [itemFormData, setItemFormData] = useState({
    brandNumber: '',
    size: '',
    brand: '',
    pattern: '',
    dot: '',
    caps: '',
    retreadPattern: '',
    locationOfDamage: '',
    reasonForDamage: '',
    photoUrl: '',
  });

  // Fetch scrap reports on mount
  useEffect(() => {
    fetchScrapReports();
    fetchTiresDatabase();
  }, []);

  const fetchTiresDatabase = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/table/tyres`, { withCredentials: true });
      setTiresDatabase(res.data || []);
    } catch (err) {
      console.warn('Failed to load tires database:', err);
    }
  };

  const fetchScrapReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/scraps`, { withCredentials: true });
      const filtered = filterScrapReportsByAccess(response.data);
      setScrapReports(filtered);
    } catch (err) {
      console.error('Error fetching scrap reports:', err);
      setError('Failed to load scrap reports');
    } finally {
      setLoading(false);
    }
  };

  const filterScrapReportsByAccess = (reports) => {
    if (user?.role === 'Administrator' || user?.role === 'Group Manager') {
      return reports;
    } else if (user?.role === 'Store Manager') {
      return reports.filter(r => r.store_id === user?.storeId);
    } else {
      return reports.filter(r => r.user_id === user?.id);
    }
  };

  // Handle report selection
  const handleSelectReport = (report) => {
    setEditingReport(report);
    setEditingItem(null);
    setIsAddingNewItem(false);
    setScrapItems(report.items || []);
  };

  // Add new report
  const handleAddNewReport = () => {
    setIsAddingNewReport(true);
    setEditingReport(null);
    setScrapItems([]);
    setReportFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      location: '',
      reportDate: new Date().toISOString().split('T')[0],
      status: 'In Progress',
    });
  };

  // Save report (header)
  const handleSaveReport = async () => {
    try {
      setError('');

      // Preflight check
      try {
        await axios.get(`${BASE_URL}/api/scraps`, { withCredentials: true });
      } catch (preErr) {
        console.warn('Preflight check failed:', preErr?.message || preErr);
      }

      // Validate required fields
      if (!reportFormData.customerName || !reportFormData.location) {
        setError('Please fill in required fields (Customer Name, Location)');
        return;
      }

      const reportData = {
        ...reportFormData,
        items: scrapItems,
        userId: user?.id,
        userName: user?.username,
        storeId: user?.storeId,
        updatedAt: new Date().toISOString(),
      };

      if (editingReport?.id) {
        // Update
        await axios.post(`${BASE_URL}/api/scraps`, {
          ...reportData,
          id: editingReport.id,
        }, { withCredentials: true });
      } else {
        // Create
        await axios.post(`${BASE_URL}/api/scraps`, reportData, { withCredentials: true });
      }

      await fetchScrapReports();
      setIsAddingNewReport(false);
      setEditingReport(null);
      setScrapItems([]);
      setReportFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        location: '',
        reportDate: new Date().toISOString().split('T')[0],
        status: 'In Progress',
      });
    } catch (err) {
      console.error('Error saving scrap report:', err);
      setError(`Failed to save scrap report: ${err?.response?.data?.code || err.message}`);
    }
  };

  // Add scrap item (tire)
  const handleAddItem = () => {
    setIsAddingNewItem(true);
    setEditingItem(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setItemFormData({
      brandNumber: '',
      size: '',
      brand: '',
      pattern: '',
      dot: '',
      caps: '',
      retreadPattern: '',
      locationOfDamage: '',
      reasonForDamage: '',
      photoUrl: '',
    });
  };

  // Save item to list (not DB yet)
  const handleSaveItem = async () => {
    try {
      setError('');

      // Validate required fields
      if (!itemFormData.brandNumber || !itemFormData.size || !itemFormData.brand) {
        setError('Please fill in required tire fields (Brand Number, Size, Brand)');
        return;
      }

      let photoUrl = itemFormData.photoUrl;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const newItem = {
        ...itemFormData,
        photoUrl,
        id: editingItem?.id || Date.now(), // Use timestamp as temp ID
      };

      if (editingItem) {
        // Update item in list
        setScrapItems(scrapItems.map(item => item.id === editingItem.id ? newItem : item));
      } else {
        // Add new item
        setScrapItems([...scrapItems, newItem]);
      }

      // Reset form
      setIsAddingNewItem(false);
      setEditingItem(null);
      setPhotoFile(null);
      setPhotoPreview('');
      setItemFormData({
        brandNumber: '',
        size: '',
        brand: '',
        pattern: '',
        dot: '',
        caps: '',
        retreadPattern: '',
        locationOfDamage: '',
        reasonForDamage: '',
        photoUrl: '',
      });
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save scrap item');
    }
  };

  // Edit item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsAddingNewItem(true);
    setPhotoPreview(item.photoUrl || '');
    setItemFormData({
      brandNumber: item.brandNumber || '',
      size: item.size || '',
      brand: item.brand || '',
      pattern: item.pattern || '',
      dot: item.dot || '',
      caps: item.caps || '',
      retreadPattern: item.retreadPattern || '',
      locationOfDamage: item.locationOfDamage || '',
      reasonForDamage: item.reasonForDamage || '',
      photoUrl: item.photoUrl || '',
    });
  };

  // Delete item
  const handleDeleteItem = (itemId) => {
    setScrapItems(scrapItems.filter(item => item.id !== itemId));
  };

  const uploadPhoto = async () => {
    if (!photoFile) return itemFormData.photoUrl;

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('photo', photoFile);
      const response = await axios.post(`${BASE_URL}/upload`, uploadFormData, { withCredentials: true });
      return response.data.path || response.data.url;
    } catch (err) {
      console.error('Error uploading photo:', err);
      throw new Error('Failed to upload photo');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReportInputChange = (e) => {
    const { name, value } = e.target;
    setReportFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setIsAddingNewReport(false);
    setEditingReport(null);
    setIsAddingNewItem(false);
    setEditingItem(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setScrapItems([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading scrap reports...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Scrap Reports</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">Scrap Reports</h2>

            <button
              onClick={handleAddNewReport}
              className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + New Report
            </button>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scrapReports.length === 0 ? (
                <p className="text-gray-500">No scrap reports yet</p>
              ) : (
                scrapReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => handleSelectReport(report)}
                    className={`w-full p-3 rounded text-left transition ${
                      editingReport?.id === report.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{report.customer_name || 'Unnamed'}</div>
                    <div className="text-sm">{report.location || 'No location'}</div>
                    <div className={`text-xs font-semibold ${
                      report.status === 'Complete' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {report.status}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Report Form & Items */}
        <div className="lg:col-span-2">
          {isAddingNewReport || editingReport ? (
            <div className="space-y-6">
              {/* Report Header Form */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingReport ? 'Edit Report' : 'New Report'}
                </h2>

                <form className="space-y-4">
                  {/* Customer Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Customer Name *</label>
                      <input
                        type="text"
                        name="customerName"
                        value={reportFormData.customerName}
                        onChange={handleReportInputChange}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder="e.g., ABC Company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Location *</label>
                      <input
                        type="text"
                        name="location"
                        value={reportFormData.location}
                        onChange={handleReportInputChange}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder="e.g., Warehouse A"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Phone</label>
                      <input
                        type="tel"
                        name="customerPhone"
                        value={reportFormData.customerPhone}
                        onChange={handleReportInputChange}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder="e.g., 555-1234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        name="customerEmail"
                        value={reportFormData.customerEmail}
                        onChange={handleReportInputChange}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder="e.g., contact@abc.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Report Date</label>
                      <input
                        type="date"
                        name="reportDate"
                        value={reportFormData.reportDate}
                        onChange={handleReportInputChange}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Status</label>
                      <select
                        name="status"
                        value={reportFormData.status}
                        onChange={handleReportInputChange}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option>In Progress</option>
                        <option>Complete</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              {/* Scrap Items */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Scrap Items ({scrapItems.length})</h3>
                  {!isAddingNewItem && (
                    <button
                      onClick={handleAddItem}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                        <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
                      </svg>
                      Add Item
                    </button>
                  )}
                </div>

                {scrapItems.length > 0 && (
                  <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                    {scrapItems.map(item => (
                      <div
                        key={item.id}
                        className="bg-gray-50 dark:bg-gray-700 p-3 rounded flex justify-between items-center"
                      >
                        <div>
                          <div className="font-semibold">{item.brand} {item.size}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Brand #: {item.brandNumber}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isAddingNewItem && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded mb-4">
                    <h4 className="font-semibold mb-3">
                      {editingItem ? 'Edit Item' : 'Add Scrap Item'}
                    </h4>

                    {/* Database Tire Selector */}
                    <div className="border p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-4">
                      <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">📋 Select Tire from Database</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Choose an existing tire to auto-fill brand and size:</p>
                      <select
                        onChange={(e) => {
                          const tire = tiresDatabase.find(t => t.id === parseInt(e.target.value));
                          if (tire) {
                            setItemFormData({
                              ...itemFormData,
                              size: tire.size || '',
                              brand: tire.brand || '',
                              pattern: tire.pattern || '',
                              dot: tire.dot || '',
                            });
                            e.target.value = ''; // Reset dropdown
                          }
                        }}
                        className="w-full px-2 py-2 border rounded dark:bg-gray-600 text-sm"
                      >
                        <option value="">-- Select a tire --</option>
                        {tiresDatabase.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.brand ? `${t.brand} - ` : ''}{t.size || 'Unknown Size'} {t.pattern ? `(${t.pattern})` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Total available: <span className="font-semibold">{tiresDatabase.length} tires</span>
                      </p>
                    </div>

                    {/* Item Form */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Brand # *</label>
                          <input
                            type="text"
                            name="brandNumber"
                            value={itemFormData.brandNumber}
                            onChange={handleItemInputChange}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                            placeholder="BN001"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Size *</label>
                          <input
                            type="text"
                            name="size"
                            value={itemFormData.size}
                            onChange={handleItemInputChange}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                            placeholder="225/75R16"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Brand *</label>
                          <input
                            type="text"
                            name="brand"
                            value={itemFormData.brand}
                            onChange={handleItemInputChange}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                            placeholder="Bridgestone"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Pattern</label>
                          <input
                            type="text"
                            name="pattern"
                            value={itemFormData.pattern}
                            onChange={handleItemInputChange}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">DOT</label>
                          <input
                            type="text"
                            name="dot"
                            value={itemFormData.dot}
                            onChange={handleItemInputChange}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Caps</label>
                          <input
                            type="text"
                            name="caps"
                            value={itemFormData.caps}
                            onChange={handleItemInputChange}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Retread Pattern</label>
                          <input
                            type="text"
                            name="retreadPattern"
                            value={itemFormData.retreadPattern}
                            onChange={handleItemInputChange}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Location of Damage</label>
                          <input
                            type="text"
                            name="locationOfDamage"
                            value={itemFormData.locationOfDamage}
                            onChange={handleItemInputChange}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Reason for Damage</label>
                        <textarea
                          name="reasonForDamage"
                          value={itemFormData.reasonForDamage}
                          onChange={handleItemInputChange}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          rows="2"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Photo</label>
                        {photoPreview && (
                          <img src={photoPreview} alt="Preview" className="max-w-xs h-24 rounded mb-2" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="w-full text-sm"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveItem}
                          className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Save Item
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingNewItem(false);
                            setEditingItem(null);
                          }}
                          className="flex-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save/Complete Report Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveReport}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save Report
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500">
              <p>Select a scrap report or create a new one to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

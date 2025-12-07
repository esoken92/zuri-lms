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
  const [companies, setCompanies] = useState([]);
  const [depots, setDepots] = useState([]);
  const [scrapData, setScrapData] = useState([]);
  const [showManualCompanyModal, setShowManualCompanyModal] = useState(false);
  const [showManualDepotModal, setShowManualDepotModal] = useState(false);
  const [manualCompanyData, setManualCompanyData] = useState({ name: '', location: '' });
  const [manualDepotData, setManualDepotData] = useState({ location: '' });

  // Scrap Report (header) form
  const [reportFormData, setReportFormData] = useState({
    companyId: '',
    depotId: '',
    location: '',
    reportDate: new Date().toISOString().split('T')[0],
    status: 'In Progress',
  });

  // Scrap Item form (individual tire)
  const [itemFormData, setItemFormData] = useState({
    tireId: '',
    brandNumber: '',
    size: '',
    brand: '',
    pattern: '',
    dot: '',
    caps: '',
    virgin: false,
    rtdHigh: '',
    rtdLow: '',
    buffed: false,
    reason1Location: '',
    reason1Code: '',
    reason1Description: '',
    reason2Location: '',
    reason2Code: '',
    reason2Description: '',
    comments: '',
    photoUrl: '',
  });
  const [showAddTireModal, setShowAddTireModal] = useState(false);
  const [newTireData, setNewTireData] = useState({
    brand: '',
    size: '',
    pattern: '',
  });

  // Fetch scrap reports on mount
  useEffect(() => {
    fetchScrapReports();
    fetchTiresDatabase();
    fetchCompanies();
    fetchDepots();
    fetchScrapData();
  }, []);

  const fetchScrapData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/table/scrap-data`, { withCredentials: true });
      console.log('[DEBUG] Scrap data loaded:', res.data);
      setScrapData(res.data || []);
    } catch (err) {
      console.error('[DEBUG] Failed to load scrap data:', err.response?.status, err.response?.data || err.message);
      setScrapData([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/table/companies`, { withCredentials: true });
      setCompanies(res.data || []);
    } catch (err) {
      console.warn('Failed to load companies:', err);
    }
  };

  const fetchDepots = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/table/depots`, { withCredentials: true });
      setDepots(res.data || []);
    } catch (err) {
      console.warn('Failed to load depots:', err);
    }
  };

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
      companyId: '',
      depotId: '',
      location: '',
      reportDate: new Date().toISOString().split('T')[0],
      status: 'In Progress',
    });
  };

  // Save report (header)
  const handleSaveReport = async () => {
    try {
      setError('');

      // Validate required fields
      if (!reportFormData.companyId || !reportFormData.depotId || !reportFormData.location) {
        setError('Please fill in required fields (Company, Depot, Location)');
        return;
      }

      const company = companies.find(c => c.id === parseInt(reportFormData.companyId));

      const reportData = {
        companyId: reportFormData.companyId,
        depotId: reportFormData.depotId,
        customerName: company?.name || 'N/A',
        customerPhone: company?.phone || '',
        customerEmail: company?.email || '',
        location: reportFormData.location,
        reportDate: reportFormData.reportDate,
        status: reportFormData.status,
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
        companyId: '',
        depotId: '',
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
      tireId: '',
      brandNumber: '',
      size: '',
      brand: '',
      pattern: '',
      dot: '',
      caps: '',
      virgin: false,
      rtdHigh: '',
      rtdLow: '',
      buffed: false,
      reason1Location: '',
      reason1Code: '',
      reason1Description: '',
      reason2Location: '',
      reason2Code: '',
      reason2Description: '',
      comments: '',
      photoUrl: '',
    });
  };

  // Save item to list (not DB yet)
  const handleSaveItem = async () => {
    try {
      setError('');

      // Validate required fields
      if (!itemFormData.tireId || !itemFormData.brandNumber || !itemFormData.dot) {
        setError('Please fill in required tire fields (Tire, Brand #, DOT)');
        return;
      }

      // Validate DOT: 4 digit integer > 0000
      const dotNum = parseInt(itemFormData.dot);
      if (isNaN(dotNum) || itemFormData.dot.length !== 4 || dotNum === 0) {
        setError('DOT must be a 4-digit number greater than 0000');
        return;
      }

      // Validate Caps: max 99
      const capsNum = parseInt(itemFormData.caps || 0);
      if (capsNum > 99) {
        setError('Caps cannot exceed 99');
        return;
      }

      // If buffed, RTD should be 0
      let rtdHighVal = itemFormData.rtdHigh;
      let rtdLowVal = itemFormData.rtdLow;
      if (itemFormData.buffed) {
        rtdHighVal = 0;
        rtdLowVal = 0;
      } else {
        // Validate RTD values if not buffed
        if (!rtdHighVal || !rtdLowVal) {
          setError('RTD High and RTD Low are required if tire is not buffed');
          return;
        }
      }

      let photoUrl = itemFormData.photoUrl;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const newItem = {
        ...itemFormData,
        rtdHigh: rtdHighVal,
        rtdLow: rtdLowVal,
        caps: itemFormData.virgin ? 0 : capsNum,
        photoUrl,
        id: editingItem?.id || Date.now(),
      };

      if (editingItem) {
        setScrapItems(scrapItems.map(item => item.id === editingItem.id ? newItem : item));
      } else {
        setScrapItems([...scrapItems, newItem]);
      }

      setIsAddingNewItem(false);
      setEditingItem(null);
      setPhotoFile(null);
      setPhotoPreview('');
      setItemFormData({
        tireId: '',
        brandNumber: '',
        size: '',
        brand: '',
        pattern: '',
        dot: '',
        caps: '',
        virgin: false,
        rtdHigh: '',
        rtdLow: '',
        buffed: false,
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
      tireId: item.tireId || '',
      brandNumber: item.brandNumber || '',
      size: item.size || '',
      brand: item.brand || '',
      pattern: item.pattern || '',
      dot: item.dot || '',
      caps: item.caps || '',
      virgin: item.virgin || false,
      rtdHigh: item.rtdHigh || '',
      rtdLow: item.rtdLow || '',
      buffed: item.buffed || false,
      reason1Location: item.reason1Location || '',
      reason1Code: item.reason1Code || '',
      reason1Description: item.reason1Description || '',
      reason2Location: item.reason2Location || '',
      reason2Code: item.reason2Code || '',
      reason2Description: item.reason2Description || '',
      comments: item.comments || '',
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
    setShowManualCompanyModal(false);
    setShowManualDepotModal(false);
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
                  {/* Company */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Company *</label>
                    <div className="flex gap-2">
                      <select
                        name="companyId"
                        value={reportFormData.companyId}
                        onChange={handleReportInputChange}
                        className="flex-1 px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="">Select Company</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowManualCompanyModal(true)}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-lg font-bold"
                        title="Manually enter company"
                      >
                        ✎
                      </button>
                    </div>
                  </div>

                  {/* Depot */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Depot *</label>
                    <div className="flex gap-2">
                      <select
                        name="depotId"
                        value={reportFormData.depotId}
                        onChange={handleReportInputChange}
                        className="flex-1 px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="">Select Depot</option>
                        {depots.map(d => (
                          <option key={d.id} value={d.id}>{d.location}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowManualDepotModal(true)}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-lg font-bold"
                        title="Manually enter depot"
                      >
                        ✎
                      </button>
                    </div>
                  </div>

                  {/* Location (Manual Entry) */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={reportFormData.location}
                      onChange={handleReportInputChange}
                      className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g., Warehouse A"
                    />
                  </div>

                  {/* Report Date */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Report Date</label>
                    <input
                      type="date"
                      name="reportDate"
                      value={reportFormData.reportDate}
                      onChange={handleReportInputChange}
                      className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Status</label>
                    <select
                      name="status"
                      value={reportFormData.status}
                      onChange={handleReportInputChange}
                      className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option>In Progress</option>
                      <option>Complete</option>
                    </select>
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

                    {/* Tire Database Selector */}
                    <div className="border p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-4">
                      <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">📋 Select Tire from Database</h5>
                      <div className="flex gap-2">
                        <select
                          value={itemFormData.tireId}
                          onChange={(e) => {
                            const tire = tiresDatabase.find(t => t.id === parseInt(e.target.value));
                            if (tire) {
                              setItemFormData({
                                ...itemFormData,
                                tireId: tire.id,
                                size: tire.size || '',
                                brand: tire.brand || '',
                                pattern: tire.pattern || '',
                              });
                            }
                          }}
                          className="flex-1 px-3 py-2 border rounded dark:bg-gray-600 text-sm"
                        >
                          <option value="">-- Select a tire --</option>
                          {tiresDatabase.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.brand ? `${t.brand} - ` : ''}{t.size || 'Unknown Size'} {t.pattern ? `(${t.pattern})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowAddTireModal(true)}
                          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-lg font-bold"
                          title="Add new tire to database"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Total available: <span className="font-semibold">{tiresDatabase.length} tires</span>
                      </p>
                    </div>

                    {/* Item Form */}
                    <div className="space-y-3">
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

                      {/* Tire Info (Auto-filled from selection) */}
                      <div className="grid grid-cols-3 gap-2 bg-gray-200 dark:bg-gray-600 p-2 rounded text-sm">
                        <div>
                          <span className="font-semibold">Size:</span> {itemFormData.size || '-'}
                        </div>
                        <div>
                          <span className="font-semibold">Brand:</span> {itemFormData.brand || '-'}
                        </div>
                        <div>
                          <span className="font-semibold">Pattern:</span> {itemFormData.pattern || '-'}
                        </div>
                      </div>

                      {/* DOT - 4 digit integer */}
                      <div>
                        <label className="block text-xs font-semibold mb-1">DOT (4 digits, &gt; 0000) *</label>
                        <input
                          type="text"
                          name="dot"
                          value={itemFormData.dot}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setItemFormData({...itemFormData, dot: val});
                          }}
                          maxLength="4"
                          className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          placeholder="1234"
                        />
                      </div>

                      {/* Caps with Virgin Toggle */}
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1">Caps (Max 99)</label>
                          <input
                            type="number"
                            name="caps"
                            value={itemFormData.virgin ? 0 : itemFormData.caps}
                            onChange={(e) => {
                              let val = parseInt(e.target.value) || 0;
                              if (val > 99) val = 99;
                              setItemFormData({...itemFormData, caps: val.toString()});
                            }}
                            disabled={itemFormData.virgin}
                            max="99"
                            min="0"
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm disabled:opacity-50"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={itemFormData.virgin}
                            onChange={(e) => {
                              setItemFormData({
                                ...itemFormData,
                                virgin: e.target.checked,
                                caps: e.target.checked ? '0' : itemFormData.caps
                              });
                            }}
                            className="w-4 h-4"
                          />
                          <label className="text-xs font-semibold">Virgin</label>
                        </div>
                      </div>

                      {/* RTD High and Low with Buffed Toggle */}
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1">RTD - High</label>
                          <input
                            type="number"
                            value={itemFormData.rtdHigh}
                            onChange={(e) => setItemFormData({...itemFormData, rtdHigh: e.target.value})}
                            disabled={itemFormData.buffed}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm disabled:opacity-50"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1">RTD - Low</label>
                          <input
                            type="number"
                            value={itemFormData.rtdLow}
                            onChange={(e) => setItemFormData({...itemFormData, rtdLow: e.target.value})}
                            disabled={itemFormData.buffed}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm disabled:opacity-50"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={itemFormData.buffed}
                            onChange={(e) => {
                              setItemFormData({
                                ...itemFormData,
                                buffed: e.target.checked,
                                rtdHigh: e.target.checked ? '0' : itemFormData.rtdHigh,
                                rtdLow: e.target.checked ? '0' : itemFormData.rtdLow
                              });
                            }}
                            className="w-4 h-4"
                          />
                          <label className="text-xs font-semibold">Buffed</label>
                        </div>
                      </div>

                      {/* Reason 1 - Location & Description */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Reason 1 - Location</label>
                          <select
                            value={itemFormData.reason1Location}
                            onChange={(e) => {
                              setItemFormData({
                                ...itemFormData,
                                reason1Location: e.target.value,
                                reason1Code: '',
                                reason1Description: ''
                              });
                            }}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          >
                            <option value="">-- Select Location --</option>
                            {Array.from(new Set(scrapData.map(d => d.location))).sort().map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1">Reason 1 - Description</label>
                          <select
                            value={itemFormData.reason1Description}
                            onChange={(e) => {
                              const damage = scrapData.find(d => d.damage_description === e.target.value);
                              setItemFormData({
                                ...itemFormData,
                                reason1Code: damage?.damage_code || '',
                                reason1Description: e.target.value
                              });
                            }}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                            disabled={!itemFormData.reason1Location}
                          >
                            <option value="">-- Select Description --</option>
                            {itemFormData.reason1Location && scrapData
                              .filter(d => d.location === itemFormData.reason1Location)
                              .map(d => (
                                <option key={d.id} value={d.damage_description}>
                                  {d.damage_description}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Reason 2 - Location & Description */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Reason 2 - Location</label>
                          <select
                            value={itemFormData.reason2Location}
                            onChange={(e) => {
                              setItemFormData({
                                ...itemFormData,
                                reason2Location: e.target.value,
                                reason2Code: '',
                                reason2Description: ''
                              });
                            }}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          >
                            <option value="">-- Select Location --</option>
                            {Array.from(new Set(scrapData.map(d => d.location))).sort().map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1">Reason 2 - Description</label>
                          <select
                            value={itemFormData.reason2Description}
                            onChange={(e) => {
                              const damage = scrapData.find(d => d.damage_description === e.target.value);
                              setItemFormData({
                                ...itemFormData,
                                reason2Code: damage?.damage_code || '',
                                reason2Description: e.target.value
                              });
                            }}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                            disabled={!itemFormData.reason2Location}
                          >
                            <option value="">-- Select Description --</option>
                            {itemFormData.reason2Location && scrapData
                              .filter(d => d.location === itemFormData.reason2Location)
                              .map(d => (
                                <option key={d.id} value={d.damage_description}>
                                  {d.damage_description}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Comments</label>
                        <textarea
                          name="comments"
                          value={itemFormData.comments}
                          onChange={handleItemInputChange}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-600 text-sm"
                          rows="2"
                          placeholder="Additional comments..."
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

      {/* Manual Company Modal */}
      {showManualCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Manually Enter Company</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  value={manualCompanyData.name}
                  onChange={(e) => setManualCompanyData({...manualCompanyData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Location</label>
                <input
                  type="text"
                  value={manualCompanyData.location}
                  onChange={(e) => setManualCompanyData({...manualCompanyData, location: e.target.value})}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  placeholder="Enter company location"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  // Add as temporary company
                  const tempId = -Date.now();
                  const tempCompany = {id: tempId, name: manualCompanyData.name, location: manualCompanyData.location};
                  setCompanies([...companies, tempCompany]);
                  setReportFormData({...reportFormData, companyId: tempId.toString()});
                  setShowManualCompanyModal(false);
                  setManualCompanyData({name: '', location: ''});
                }}
                className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowManualCompanyModal(false);
                  setManualCompanyData({name: '', location: ''});
                }}
                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Depot Modal */}
      {showManualDepotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Manually Enter Depot</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Depot Location</label>
                <input
                  type="text"
                  value={manualDepotData.location}
                  onChange={(e) => setManualDepotData({...manualDepotData, location: e.target.value})}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  placeholder="Enter depot location"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  // Add as temporary depot
                  const tempId = -Date.now();
                  const tempDepot = {id: tempId, location: manualDepotData.location};
                  setDepots([...depots, tempDepot]);
                  setReportFormData({...reportFormData, depotId: tempId.toString()});
                  setShowManualDepotModal(false);
                  setManualDepotData({location: ''});
                }}
                className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowManualDepotModal(false);
                  setManualDepotData({location: ''});
                }}
                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tire Modal */}
      {showAddTireModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add New Tire</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Brand</label>
                <input
                  type="text"
                  value={newTireData.brand}
                  onChange={(e) => setNewTireData({...newTireData, brand: e.target.value})}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  placeholder="e.g., Bridgestone"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Size</label>
                <input
                  type="text"
                  value={newTireData.size}
                  onChange={(e) => setNewTireData({...newTireData, size: e.target.value})}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  placeholder="e.g., 225/75R16"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Pattern</label>
                <input
                  type="text"
                  value={newTireData.pattern}
                  onChange={(e) => setNewTireData({...newTireData, pattern: e.target.value})}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  placeholder="e.g., AT"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  // Add as temporary tire (would be synced to DB on save)
                  const tempId = -Date.now();
                  const tempTire = {...newTireData, id: tempId};
                  setTiresDatabase([...tiresDatabase, tempTire]);
                  setItemFormData({
                    ...itemFormData,
                    tireId: tempId,
                    brand: newTireData.brand,
                    size: newTireData.size,
                    pattern: newTireData.pattern,
                  });
                  setShowAddTireModal(false);
                  setNewTireData({brand: '', size: '', pattern: ''});
                }}
                className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddTireModal(false);
                  setNewTireData({brand: '', size: '', pattern: ''});
                }}
                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
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

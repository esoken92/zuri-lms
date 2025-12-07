import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

const BASE_URL = process.env.REACT_APP_API_URL;

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
};

function Reports() {
  const [allInspections, setAllInspections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filterTire, setFilterTire] = useState('');
  const [filterDamage, setFilterDamage] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedInspection, setSelectedInspection] = useState(null);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/inspections`, { withCredentials: true });
      setAllInspections(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error('Error fetching inspections:', err);
    }
  };

  useEffect(() => {
    let results = [...allInspections];

    if (search) {
      results = results.filter(insp =>
        insp.vehicleId.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterTire) {
      results = results.filter(insp => insp.tirePosition === filterTire);
    }

    if (filterDamage) {
      results = results.filter(insp => insp.damage === filterDamage);
    }

    if (filterDate) {
      results = results.filter(insp => insp.date === filterDate);
    }

    results.sort((a, b) =>
      sortOrder === 'desc'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

    setFiltered(results);
  }, [search, filterTire, filterDamage, filterDate, allInspections, sortOrder]);

  const generatePDF = () => {
    const input = document.getElementById('report-table');
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`zuri-inspections-${getTimestamp()}.pdf`);
    });
  };

  const exportFilteredCSV = () => {
    const csvData = filtered.map(insp => ({
      Date: insp.date,
      Vehicle: insp.vehicleId,
      Tire: insp.tirePosition,
      Tread_mm: insp.treadDepth,
      Pressure_bar: insp.pressure,
      Damage: insp.damage,
      Photo: insp.photo ? `${BASE_URL}${insp.photo}` : 'No Photo'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `filtered-inspections-${getTimestamp()}.csv`);
  };

  const exportAllCSV = () => {
    const csvData = allInspections.map(insp => ({
      Date: insp.date,
      Vehicle: insp.vehicleId,
      Tire: insp.tirePosition,
      Tread_mm: insp.treadDepth,
      Pressure_bar: insp.pressure,
      Damage: insp.damage,
      Photo: insp.photo ? `${BASE_URL}${insp.photo}` : 'No Photo'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `all-inspections-${getTimestamp()}.csv`);
  };

  const stats = {
    total: filtered.length,
    byTire: {},
    byDamage: {},
    avgTread: filtered.length > 0 ? (filtered.reduce((sum, i) => sum + parseFloat(i.treadDepth || 0), 0) / filtered.length).toFixed(2) : 'N/A',
    avgPressure: filtered.length > 0 ? (filtered.reduce((sum, i) => sum + parseFloat(i.pressure || 0), 0) / filtered.length).toFixed(2) : 'N/A',
  };

  filtered.forEach(insp => {
    stats.byTire[insp.tirePosition] = (stats.byTire[insp.tirePosition] || 0) + 1;
    if (insp.damage) stats.byDamage[insp.damage] = (stats.byDamage[insp.damage] || 0) + 1;
  });

  return (
    <div className="flex gap-4 p-6 bg-gray-50 min-h-screen dark:bg-gray-900">
      {/* Left Panel - Filters & Stats */}
      <div className="w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Filters</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Vehicle ID
            </label>
            <input
              placeholder="Enter Vehicle ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tire Position
            </label>
            <select value={filterTire} onChange={(e) => setFilterTire(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
              <option value="">All Positions</option>
              <option value="FL">Front Left (FL)</option>
              <option value="FR">Front Right (FR)</option>
              <option value="RL">Rear Left (RL)</option>
              <option value="RR">Rear Right (RR)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Damage Type
            </label>
            <select value={filterDamage} onChange={(e) => setFilterDamage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
              <option value="">All Damages</option>
              {Object.keys(stats.byDamage).map(dmg => (
                <option key={dmg} value={dmg}>{dmg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort Order
            </label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Statistics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Records:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg Tread:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.avgTread}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg Pressure:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.avgPressure}bar</span>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">By Position:</h4>
            {Object.entries(stats.byTire).map(([pos, count]) => (
              <div key={pos} className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{pos}:</span>
                <span className="text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Table & Details */}
      <div className="w-3/4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Inspection Reports</h2>
            <p className="text-blue-100 text-sm">{filtered.length} of {allInspections.length} records shown</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="bg-white text-blue-600 px-3 py-1 rounded font-semibold hover:bg-blue-50 transition text-sm"
            >
              PDF
            </button>
            <button
              onClick={exportFilteredCSV}
              className="bg-white text-blue-600 px-3 py-1 rounded font-semibold hover:bg-blue-50 transition text-sm"
            >
              Export
            </button>
          </div>
        </div>

        <div id="report-table" className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No inspections found matching your filters.</div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Vehicle</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Position</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Tread (mm)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Pressure (bar)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Damage</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Photo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((insp) => (
                  <tr
                    key={insp.id}
                    onClick={() => setSelectedInspection(insp)}
                    className={`border-b border-gray-200 dark:border-gray-700 cursor-pointer transition ${
                      selectedInspection?.id === insp.id
                        ? 'bg-blue-50 dark:bg-blue-900'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{insp.date}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{insp.vehicleId}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{insp.tirePosition}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{insp.treadDepth}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{insp.pressure}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{insp.damage || '-'}</td>
                    <td className="px-4 py-3">
                      {insp.photo ? (
                        <img
                          src={`${BASE_URL}${insp.photo}`}
                          alt="Thumbnail"
                          className="w-12 h-8 object-cover rounded cursor-pointer hover:opacity-75"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;

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

function ReportPage() {
  const [allInspections, setAllInspections] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedInspection, setSelectedInspection] = useState(null);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/inspections`, { withCredentials: true });
      const data = res.data || [];
      setAllInspections(data);
      applySort(data, sortOrder);
    } catch (err) {
      console.error('Error fetching inspections:', err);
    }
  };

  const applySort = (data, order) => {
    const sorted = [...data].sort((a, b) =>
      order === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)
    );
    setFilteredInspections(sorted);
  };

  useEffect(() => {
    applySort(allInspections, sortOrder);
  }, [sortOrder]);

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

  const exportAllCSV = () => {
    const csvData = filteredInspections.map(insp => ({
      Date: insp.date,
      Vehicle: insp.vehicleId,
      Tire: insp.tirePosition,
      Tread_mm: insp.treadDepth,
      Pressure_bar: insp.pressure,
      Damage: insp.damage,
      Photo: insp.photo ? `${BASE_URL}${insp.photo}` : 'No Photo',
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `zuri-inspections-${getTimestamp()}.csv`);
  };

  // Calculate statistics
  const stats = {
    total: filteredInspections.length,
    byTire: {},
    byDamage: {},
    avgTread: filteredInspections.length > 0
      ? (filteredInspections.reduce((sum, i) => sum + parseFloat(i.treadDepth || 0), 0) / filteredInspections.length).toFixed(2)
      : 'N/A',
    avgPressure: filteredInspections.length > 0
      ? (filteredInspections.reduce((sum, i) => sum + parseFloat(i.pressure || 0), 0) / filteredInspections.length).toFixed(2)
      : 'N/A',
  };

  filteredInspections.forEach(insp => {
    stats.byTire[insp.tirePosition] = (stats.byTire[insp.tirePosition] || 0) + 1;
    if (insp.damage) stats.byDamage[insp.damage] = (stats.byDamage[insp.damage] || 0) + 1;
  });

  const monthlySummary = () => {
    const summary = {};
    filteredInspections.forEach((insp) => {
      const month = new Date(insp.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      summary[month] = (summary[month] || 0) + 1;
    });
    return summary;
  };

  return (
    <div className="flex gap-4 p-6 bg-gray-50 min-h-screen dark:bg-gray-900">
      {/* Left Panel - Statistics */}
      <div className="w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Overview</h2>

        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{stats.total}</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Tread Depth</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-300">{stats.avgTread}mm</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Pressure</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-300">{stats.avgPressure}bar</p>
          </div>
        </div>

        {/* By Position */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">By Tire Position</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(stats.byTire).map(([pos, count]) => (
              <div key={pos} className="flex justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <span className="font-medium text-gray-700 dark:text-gray-300">{pos}:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Damage */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Damage Types</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(stats.byDamage).length > 0 ? (
              Object.entries(stats.byDamage).map(([dmg, count]) => (
                <div key={dmg} className="flex justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{dmg}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-xs">No damage reported</p>
            )}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Monthly Summary</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(monthlySummary()).map(([month, count]) => (
              <div key={month} className="flex justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <span className="text-gray-700 dark:text-gray-300">{month}:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Table */}
      <div className="w-3/4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">All Inspection Records</h2>
            <p className="text-blue-100 text-sm">{filteredInspections.length} total inspections</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1 rounded text-sm bg-white text-blue-600 font-semibold"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <button
              onClick={generatePDF}
              className="bg-white text-blue-600 px-3 py-1 rounded font-semibold hover:bg-blue-50 transition text-sm"
            >
              PDF
            </button>
            <button
              onClick={exportAllCSV}
              className="bg-white text-blue-600 px-3 py-1 rounded font-semibold hover:bg-blue-50 transition text-sm"
            >
              Export
            </button>
          </div>
        </div>

        <div id="report-table" className="flex-1 overflow-auto">
          {filteredInspections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No inspection records found.</div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Vehicle ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Position</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Tread (mm)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Pressure (bar)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Damage</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Photo</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((insp) => (
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

export default ReportPage;

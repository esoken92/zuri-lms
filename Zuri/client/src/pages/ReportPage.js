import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import SyncStatusBar from '../components/SyncStatusBar';

const BASE_URL = process.env.REACT_APP_API_URL;

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
};

function calculateCPK(data, key) {
  const values = data.map(item => parseFloat(item[key])).filter(v => !isNaN(v));
  if (values.length < 2) return 'N/A';
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stddev = Math.sqrt(values.map(v => (v - mean) ** 2).reduce((a, b) => a + b) / (values.length - 1));
  const lowerSpec = key === 'treadDepth' ? 1.6 : 2.0;
  const upperSpec = key === 'treadDepth' ? 12 : 8;
  const cpk = Math.min((mean - lowerSpec) / (3 * stddev), (upperSpec - mean) / (3 * stddev));
  return cpk.toFixed(2);
}

function ReportPage() {
  const [inspections, setInspections] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');
  const [visibleCols, setVisibleCols] = useState({
    date: true,
    vehicleId: true,
    tirePosition: true,
    treadDepth: true,
    pressure: true,
    damage: true,
    photo: true,
  });

  useEffect(() => {
    axios.get(`${BASE_URL}/inspections`)
      .then(res => setInspections(res.data))
      .catch(err => console.error(err));
  }, []);

  const sortedInspections = [...inspections].sort((a, b) =>
    sortOrder === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)
  );

  const monthlySummary = () => {
    const summary = {};
    sortedInspections.forEach(insp => {
      const month = new Date(insp.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      summary[month] = (summary[month] || 0) + 1;
    });
    return summary;
  };

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

  const printPreview = () => {
    window.print();
  };

  const downloadCSV = () => {
    const csvData = sortedInspections.map(insp => ({
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

  return (
    <div style={{ maxWidth: '1000px', margin: 'auto', padding: '2rem' }}>
      <SyncStatusBar syncing={false} pendingCount={0} forceSync={() => {}} />
      <h1>Zuri Inspection Report (All Records)</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>Sort by: </label>
        <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        {Object.keys(visibleCols).map(col => (
          <label key={col} style={{ marginRight: '1rem' }}>
            <input
              type="checkbox"
              checked={visibleCols[col]}
              onChange={() => setVisibleCols({ ...visibleCols, [col]: !visibleCols[col] })}
            /> {col.charAt(0).toUpperCase() + col.slice(1)}
          </label>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Monthly Summary:</strong>
        <ul>
          {Object.entries(monthlySummary()).map(([month, count]) => (
            <li key={month}>{month}: {count} inspections</li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>CPK:</strong>
        <p>Tread Depth: {calculateCPK(sortedInspections, 'treadDepth')}</p>
        <p>Pressure: {calculateCPK(sortedInspections, 'pressure')}</p>
      </div>

      <div id="report-table">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {visibleCols.date && <th>Date</th>}
              {visibleCols.vehicleId && <th>Vehicle</th>}
              {visibleCols.tirePosition && <th>Tire</th>}
              {visibleCols.treadDepth && <th>Tread (mm)</th>}
              {visibleCols.pressure && <th>Pressure (bar)</th>}
              {visibleCols.damage && <th>Damage</th>}
              {visibleCols.photo && <th>Photo</th>}
            </tr>
          </thead>
          <tbody>
            {sortedInspections.map(insp => (
              <tr key={insp.id}>
                {visibleCols.date && <td>{insp.date}</td>}
                {visibleCols.vehicleId && <td>{insp.vehicleId}</td>}
                {visibleCols.tirePosition && <td>{insp.tirePosition}</td>}
                {visibleCols.treadDepth && <td>{insp.treadDepth}</td>}
                {visibleCols.pressure && <td>{insp.pressure}</td>}
                {visibleCols.damage && <td>{insp.damage}</td>}
                {visibleCols.photo && (
                  <td>
                    {insp.photo ? (
                      <a href={`${BASE_URL}${insp.photo}`} target="_blank" rel="noreferrer">
                        <img src={`${BASE_URL}${insp.photo}`} alt="Thumbnail" style={{ width: '60px', height: '40px', objectFit: 'cover' }} />
                      </a>
                    ) : 'No Photo'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button onClick={generatePDF} style={{ marginRight: '1rem' }}>Download PDF</button>
        <button onClick={printPreview} style={{ marginRight: '1rem' }}>Print Preview</button>
        <button onClick={downloadCSV}>Export All CSV</button>
      </div>
    </div>
  );
}

export default ReportPage;

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

function Reports() {
  const [inspections, setInspections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filterTire, setFilterTire] = useState('');
  const [filterDamage, setFilterDamage] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [visibleCols, setVisibleCols] = useState({
    date: true,
    vehicleId: true,
    tirePosition: true,
    treadDepth: true,
    pressure: true,
    damage: true,
    photo: true
  });

  useEffect(() => {
    axios.get(`${BASE_URL}/inspections`)
      .then(res => {
        setInspections(res.data);
        setFiltered(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    let results = [...inspections];

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
  }, [search, filterTire, filterDamage, filterDate, inspections, sortOrder]);

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
    const csvData = inspections.map(insp => ({
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

  const monthlySummary = () => {
    const summary = {};
    filtered.forEach((insp) => {
      const month = new Date(insp.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      summary[month] = (summary[month] || 0) + 1;
    });
    return summary;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: 'auto', padding: '2rem' }}>
      <SyncStatusBar syncing={false} pendingCount={0} forceSync={() => {}} />
      <h1>Zuri Inspection Reports</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Search Vehicle ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginRight: '1rem' }}
        />
        <select onChange={(e) => setFilterTire(e.target.value)} value={filterTire}>
          <option value="">All Tires</option>
          <option value="FL">FL</option>
          <option value="FR">FR</option>
          <option value="RL">RL</option>
          <option value="RR">RR</option>
        </select>
        <select onChange={(e) => setFilterDamage(e.target.value)} value={filterDamage} style={{ marginLeft: '1rem' }}>
          <option value="">All Damages</option>
          <option value="None">None</option>
          <option value="Crack">Crack</option>
          <option value="Bald">Bald</option>
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ marginLeft: '1rem' }}
        />
        <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder} style={{ marginLeft: '1rem' }}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* Column toggle checkboxes */}
      <div style={{ marginBottom: '1rem' }}>
        {Object.keys(visibleCols).map(col => (
          <label key={col} style={{ marginRight: '1rem' }}>
            <input
              type="checkbox"
              checked={visibleCols[col]}
              onChange={() => setVisibleCols({ ...visibleCols, [col]: !visibleCols[col] })}
            />{' '}
            {col.charAt(0).toUpperCase() + col.slice(1)}
          </label>
        ))}
      </div>

      {/* Monthly Summary */}
      <div style={{ marginBottom: '1rem' }}>
        <strong>Monthly Summary:</strong>
        <ul>
          {Object.entries(monthlySummary()).map(([month, count]) => (
            <li key={month}>{month}: {count} inspections</li>
          ))}
        </ul>
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
            {filtered.map(insp => (
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
                        <img
                          src={`${BASE_URL}${insp.photo}`}
                          alt="Thumbnail"
                          style={{ width: '60px', height: '40px', objectFit: 'cover' }}
                        />
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
        <button onClick={exportFilteredCSV} style={{ marginRight: '1rem' }}>Export Filtered CSV</button>
        <button onClick={exportAllCSV}>Export All CSV</button>
      </div>
    </div>
  );
}

export default Reports;

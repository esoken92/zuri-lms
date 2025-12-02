import React, { useState, useEffect } from 'react';
import CompanyForm from './CompanyForm';
import DepotForm from './DepotForm';

const tabMap = {
  'Tyre Database': 'tyres',
  'Vehicle Configuration Database': 'vehicles',
  'Company Database': 'companies',
  'Depot Database': 'depots',
  'User Database': 'users'
};

function TabbedDatabasePanel({ activeTab }) {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [locked, setLocked] = useState(false);
  const [lockedFields, setLockedFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteClicks, setDeleteClicks] = useState([]);
  const [search, setSearch] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [logSearch, setLogSearch] = useState('');
  const key = tabMap[activeTab];

  useEffect(() => {
    if (!key) return;

    // Load table data
    fetch(`/api/table/${key}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setHeaders(Object.keys(json[0] || {}));
      })
      .catch(() => {
        const fallback = JSON.parse(localStorage.getItem(`zuri-db-${key}`) || '[]');
        setData(fallback);
        setHeaders(Object.keys(fallback[0] || {}));
      });

    // Load audit log
    fetch(`/api/logs/${key}`)
      .then(res => res.json())
      .then(setAuditLog)
      .catch(() => setAuditLog([]));

    const syncTime = localStorage.getItem(`zuri-last-sync-${key}`);
    setLastSynced(syncTime);
  }, [key]);

  const logAction = (action, row = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      user: 'admin',
      row
    };
    fetch('/api/log-survey-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    setAuditLog(prev => [...prev, entry]);
  };

  const saveData = (updated) => {
    setData(updated);
    fetch(`/api/table/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(() => {
        setSyncStatus('success');
        const syncTime = new Date().toISOString();
        setLastSynced(syncTime);
        localStorage.setItem(`zuri-last-sync-${key}`, syncTime);
        setTimeout(() => setSyncStatus(null), 3000);
      })
      .catch(() => {
        setSyncStatus('failed');
        setTimeout(() => setSyncStatus(null), 3000);
      });
  };

  const handleCellChange = (rowIndex, header, value) => {
    if (locked || lockedFields.includes(header)) return;
    const updated = [...data];
    updated[rowIndex][header] = value;
    updated[rowIndex]['lastModified'] = new Date().toISOString();
    saveData(updated);
    logAction(`Edited "${header}"`, updated[rowIndex]);
  };

  const handleAddColumn = () => {
    if (locked) return;
    const colName = prompt('Enter new column name:');
    if (!colName) return;
    const updatedHeaders = [...headers, colName];
    const updatedData = data.map(row => ({ ...row, [colName]: '' }));
    setHeaders(updatedHeaders);
    saveData(updatedData);
    logAction(`Added column "${colName}"`);
  };

  const handleAddRow = () => {
    const blankRow = headers.reduce((obj, h) => ({ ...obj, [h]: '' }), {});
    blankRow['lastModified'] = new Date().toISOString();
    const updated = [...data, blankRow];
    saveData(updated);
    logAction('Added row', blankRow);
  };

  const handleDeleteRow = (index) => {
    const updated = [...data];
    updated[index].deleted = true;
    updated[index].deleteCount = (updated[index].deleteCount || 0) + 1;
    updated[index].lastModified = new Date().toISOString();
    saveData(updated);
    logAction('Deleted row', updated[index]);
  };

  const handleRestoreRow = (index) => {
    const updated = [...data];
    updated[index].deleted = false;
    updated[index].lastModified = new Date().toISOString();
    saveData(updated);
    logAction('Restored row', updated[index]);
  };

  const handleUpload = (e) => {
    if (locked) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    setLoading(true);
    reader.onload = (evt) => {
      const lines = evt.target.result.split('\n').filter(Boolean);
      const newHeaders = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return Object.fromEntries(newHeaders.map((h, i) => [h, values[i] || '']));
      });
      newHeaders.push('lastModified');
      const timestampedRows = rows.map(row => ({ ...row, lastModified: new Date().toISOString() }));
      setHeaders(newHeaders);
      saveData(timestampedRows);
      setLoading(false);
      logAction('Uploaded CSV');
    };
    if (file) reader.readAsText(file);
  };

  const exportToCSV = () => {
    if (!data.length) return;
    setLoading(true);
    const visibleData = data.filter(row => !row.deleted);
    const csvHeaders = headers.join(',');
    const csvRows = visibleData.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','));
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${key}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoading(false);
    logAction('Exported CSV');
  };

  const handleDeleteAll = () => {
    const now = Date.now();
    const recentClicks = [...deleteClicks.filter(t => now - t < 5000), now];
    setDeleteClicks(recentClicks);
    if (recentClicks.length >= 3) {
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      const input = prompt(`Final Deletion Warning!\nType the following number to confirm deletion:\n${code}`);
      if (input === code) {
        fetch(`/api/table/${key}`, { method: 'DELETE' })
          .then(() => {
            setData([]);
            setHeaders([]);
            logAction('Deleted all data');
            alert('All data permanently deleted.');
          })
          .catch(() => alert('Failed to delete'));
      } else {
        alert('Incorrect code. Aborting.');
      }
      setDeleteClicks([]);
    }
  };

  const toggleFieldLock = (header) => {
    if (lockedFields.includes(header)) {
      setLockedFields(lockedFields.filter(f => f !== header));
    } else {
      setLockedFields([...lockedFields, header]);
    }
  };

  const downloadAuditLog = () => {
    const rows = auditLog.map(entry => `${entry.timestamp},${entry.user},${entry.action}`);
    const content = ['Timestamp,User,Action', ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${key}-audit-log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadDashboardCSV = () => {
    const content = `Tab,Last Synced\n${activeTab},${lastSynced || 'N/A'}`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dashboard-${key}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = data.filter(row =>
    headers.some(h => (row[h] || '').toString().toLowerCase().includes(search.toLowerCase()))
  );

  const filteredLog = auditLog.filter(entry =>
    entry.timestamp.toLowerCase().includes(logSearch.toLowerCase()) ||
    entry.user.toLowerCase().includes(logSearch.toLowerCase()) ||
    entry.action.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div>
      {activeTab === 'Company Database' ? (
        <CompanyForm />
      ) : activeTab === 'Depot Database' ? (
        <DepotForm />
      ) : (
        <>
          {loading && <div className="h-1 w-full bg-blue-400 animate-pulse mb-2"></div>}
      {syncStatus && (
        <div className={`text-sm p-2 rounded mb-2 ${
          syncStatus === 'success' ? 'bg-green-200 text-green-800' :
          syncStatus === 'failed' ? 'bg-red-200 text-red-800' :
          'bg-yellow-200 text-yellow-800'}`}>
          {syncStatus === 'syncing' && '🔄 Syncing...'}
          {syncStatus === 'success' && '✅ Sync Successful'}
          {syncStatus === 'failed' && '❌ Sync Failed'}
        </div>
      )}
      {lastSynced && <p className="text-xs text-gray-500 mb-2">Last Synced: {lastSynced}</p>}

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 px-3 py-1 border border-gray-300 rounded w-full"
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="file" accept=".csv,.txt" onChange={handleUpload} />
        <button onClick={handleAddColumn} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
          </svg>
          Add Column
        </button>
        <button onClick={handleAddRow} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
          </svg>
          Add Row
        </button>
        <button onClick={exportToCSV} className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">⬇ Export CSV</button>
        <button onClick={handleDeleteAll} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">🗑 Delete All</button>
        <button
          onClick={() => setLocked(!locked)}
          className={`px-3 py-1 rounded ${locked ? 'bg-red-600' : 'bg-gray-600'} text-white`}>
          {locked ? '🔒 Locked' : '🔓 Editable'}
        </button>
      </div>

      <div className="overflow-x-auto max-h-[500px] border border-gray-300 rounded">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left font-medium">
                  <div className="flex items-center justify-between">
                    {header}
                    <button onClick={() => toggleFieldLock(header)} className="text-xs text-gray-500 ml-2 hover:underline">
                      {lockedFields.includes(header) ? '🔒' : '🔓'}
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIndex) => (
              <tr key={rowIndex} className={row.deleted ? 'bg-red-100 text-gray-500' : 'odd:bg-white even:bg-gray-50'}>
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    <input
                      type="text"
                      value={row[header] || ''}
                      disabled={locked || row.deleted || lockedFields.includes(header)}
                      onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                      className="w-full border border-gray-300 rounded px-1 py-0.5 text-sm bg-white"
                    />
                  </td>
                ))}
                <td className="px-4 py-2 whitespace-nowrap">
                  {!row.deleted ? (
                    <button onClick={() => handleDeleteRow(rowIndex)} className="text-red-600 hover:underline">Delete</button>
                  ) : (
                    <button onClick={() => handleRestoreRow(rowIndex)} className="text-blue-600 hover:underline">Restore</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold mb-2">Audit Log</h4>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            placeholder="Search audit log..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <button
            onClick={downloadAuditLog}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            ⬇ Export Log
          </button>
          <button
            onClick={downloadDashboardCSV}
            className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
          >
            ⬇ Export Dashboard
          </button>
        </div>
        <ul className="text-xs max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
          {filteredLog.slice().reverse().map((entry, i) => (
            <li key={i} className="mb-1">
              [{entry.timestamp}] <strong>{entry.user}</strong> - {entry.action}
            </li>
          ))}
        </ul>
      </div>
        </>
      )}
    </div>
  );
}

export default TabbedDatabasePanel;

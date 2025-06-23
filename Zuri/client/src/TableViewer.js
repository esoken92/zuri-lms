import React, { useEffect, useState } from 'react';
import { fetchTable, clearTable, exportTable } from './api';

export default function TableViewer({ table, user }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('');

  useEffect(() => {
    fetchTable(table).then(setRows);
  }, [table]);

  const visibleRows = rows
    .filter(row =>
      filter === '' || Object.values(row).some(val =>
        val?.toString().toLowerCase().includes(filter.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortKey) return 0;
      return a[sortKey]?.localeCompare?.(b[sortKey]) || 0;
    });

  return (
    <div>
      <input
        placeholder="Search..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            {rows[0] && Object.keys(rows[0]).map(k => (
              <th key={k} onClick={() => setSortKey(k)} style={{ cursor: 'pointer' }}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, idx) => (
            <tr key={idx}>
              {Object.values(row).map((v, i) => <td key={i}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '10px' }}>
        <button onClick={() => exportTable(table, 'json')}>Export JSON</button>
        <button onClick={() => exportTable(table, 'csv')}>Export CSV</button>
        {user.role === 'Administrator' && <button onClick={() => clearTable(table).then(() => fetchTable(table).then(setRows))}>Clear Table</button>}
      </div>
    </div>
  );
}

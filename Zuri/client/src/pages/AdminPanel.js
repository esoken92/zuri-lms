import React, { useState, useEffect } from 'react';

function AdminPanel() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tire-database');
    if (saved) {
      const parsed = JSON.parse(saved);
      setData(parsed);
      setHeaders(Object.keys(parsed[0] || {}));
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const lines = evt.target.result.split('\n').filter(Boolean);
      const newHeaders = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return Object.fromEntries(newHeaders.map((h, i) => [h, values[i] || '']));
      });
      setHeaders(newHeaders);
      setData(rows);
      localStorage.setItem('tire-database', JSON.stringify(rows));
    };

    if (file) reader.readAsText(file);
  };

  const handleCellChange = (rowIndex, header, value) => {
    const updated = [...data];
    updated[rowIndex][header] = value;
    setData(updated);
    localStorage.setItem('tire-database', JSON.stringify(updated));
  };

  const handleAddColumn = () => {
    const newCol = prompt('Enter new column name:');
    if (!newCol) return;

    const updatedHeaders = [...headers, newCol];
    const updatedData = data.map(row => ({ ...row, [newCol]: '' }));
    setHeaders(updatedHeaders);
    setData(updatedData);
    localStorage.setItem('tire-database', JSON.stringify(updatedData));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tire Data Management (Admin Only)</h2>
      <div className="flex items-center gap-4 mb-4">
        <input type="file" accept=".csv,.txt" onChange={handleFileUpload} />
        <button
          onClick={handleAddColumn}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
          </svg>
          Add Column
        </button>
      </div>

      <div className="overflow-x-auto max-h-[500px] border border-gray-300 rounded">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-white even:bg-gray-50">
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    <input
                      type="text"
                      value={row[header] || ''}
                      onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                      className="w-full border border-gray-300 rounded px-1 py-0.5 text-sm"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPanel;

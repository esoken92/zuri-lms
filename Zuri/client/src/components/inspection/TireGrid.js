import React, { useState } from 'react';

function TireGrid({ tires, onTireChange, vehicleConfig }) {
  const [expandedTire, setExpandedTire] = useState(null);

  const handleTireFieldChange = (tireIndex, field, value) => {
    const updatedTires = [...tires];
    updatedTires[tireIndex][field] = value;
    onTireChange(updatedTires);
  };

  const handlePhotoChange = (tireIndex, file) => {
    if (file && file.size > 10 * 1024 * 1024) {
      alert(`File exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      handleTireFieldChange(tireIndex, 'photo', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-6 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">Tire Inspection</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Enter tread depth measurements (Inner, Middle, Outer), pressure, and comments for each tire
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Position</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Inner Depth</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Middle Depth</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Outer Depth</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Pressure</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Comments</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Photo</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Expand</th>
            </tr>
          </thead>
          <tbody>
            {tires.map((tire, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">
                  {tire.positionName || tire.position}
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    step="0.1"
                    value={tire.depthInner || ''}
                    onChange={(e) => handleTireFieldChange(idx, 'depthInner', parseFloat(e.target.value) || '')}
                    placeholder="-"
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-center"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    step="0.1"
                    value={tire.depthMiddle || ''}
                    onChange={(e) => handleTireFieldChange(idx, 'depthMiddle', parseFloat(e.target.value) || '')}
                    placeholder="-"
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-center"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    step="0.1"
                    value={tire.depthOuter || ''}
                    onChange={(e) => handleTireFieldChange(idx, 'depthOuter', parseFloat(e.target.value) || '')}
                    placeholder="-"
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-center"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    step="0.1"
                    value={tire.pressure || ''}
                    onChange={(e) => handleTireFieldChange(idx, 'pressure', parseFloat(e.target.value) || '')}
                    placeholder="PSI"
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-center"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="text"
                    maxLength="50"
                    value={tire.comments || ''}
                    onChange={(e) => handleTireFieldChange(idx, 'comments', e.target.value)}
                    placeholder="Brief note"
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-xs"
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(idx, e.target.files[0])}
                      className="hidden"
                    />
                    <span className="text-blue-500 hover:underline">📷</span>
                  </label>
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => setExpandedTire(expandedTire === idx ? null : idx)}
                    className="text-blue-500 hover:text-blue-700 font-bold"
                  >
                    {expandedTire === idx ? '▼' : '▶'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded tire details */}
      {expandedTire !== null && tires[expandedTire] && (
        <div className="bg-blue-50 dark:bg-blue-900 p-4 border-t border-gray-300 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Full Comments (up to 300 chars)
              </label>
              <textarea
                value={tires[expandedTire].comments || ''}
                onChange={(e) => handleTireFieldChange(expandedTire, 'comments', e.target.value.slice(0, 300))}
                maxLength="300"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                placeholder="Detailed comments about tire condition..."
              />
              <p className="text-xs text-gray-500 mt-1">{(tires[expandedTire].comments || '').length}/300</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Photo
              </label>
              {tires[expandedTire].photo && (
                <div className="mb-3">
                  <img
                    src={tires[expandedTire].photo}
                    alt="Tire"
                    className="max-w-40 max-h-40 rounded border border-gray-300"
                  />
                </div>
              )}
              <label className="block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer text-sm text-center hover:bg-blue-600">
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(expandedTire, e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TireGrid;

import React from 'react';

function InspectionHeader({
  headerData,
  companies,
  depots,
  onHeaderChange,
  onManualCompanyAdd,
  onManualDepotAdd,
  user,
}) {
  return (
    <div className="border-l-4 border-blue-500 pl-6 py-4 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900 dark:to-transparent rounded-r-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Inspection Header</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Company */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Company *
          </label>
          <div className="flex gap-2">
            <select
              name="companyId"
              value={headerData.companyId}
              onChange={onHeaderChange}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onManualCompanyAdd()}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-bold"
              title="Manually enter company details"
            >
              ✎
            </button>
          </div>
        </div>

        {/* Depot */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Depot *
          </label>
          <div className="flex gap-2">
            <select
              name="depotId"
              value={headerData.depotId}
              onChange={onHeaderChange}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Depot</option>
              {depots.map(d => (
                <option key={d.id} value={d.id}>{d.location}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onManualDepotAdd()}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-bold"
              title="Manually enter depot details"
            >
              ✎
            </button>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Date *
          </label>
          <input
            type="date"
            name="date"
            value={headerData.date}
            onChange={onHeaderChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={headerData.location}
            onChange={onHeaderChange}
            placeholder="Enter location"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

export default InspectionHeader;

import React, { useState } from 'react';
import TabbedDatabasePanel from '../components/admin/TabbedDatabasePanel';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const tabs = [
    'Dashboard',
    'Tyre Database',
    'Vehicle Configuration Database',
    'Company Database',
    'Depot Database',
    'User Database',
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Administrator Panel</h2>
      <div className="flex gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <TabbedDatabasePanel activeTab={activeTab} />
    </div>
  );
}

export default AdminDashboard;

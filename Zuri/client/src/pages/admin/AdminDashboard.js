import React, { useState } from 'react';
import TabbedDatabasePanel from '../../components/admin/TabbedDatabasePanel';
import SuggestionsPanel from '../../components/admin/SuggestionsPanel';
import VehicleConfigBuilder from './VehicleConfigBuilder';
import AdminPanel from '../AdminPanel';
import ScrapDataPanel from '../ScrapDataPanel';

function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const tabs = [
    { name: 'Dashboard', icon: '📊', color: 'blue-600', description: 'View system overview and statistics' },
    { name: 'User Suggestions', icon: '💡', color: 'cyan-600', description: 'Review and manage user feedback' },
    { name: 'Scrap Data', icon: '🔧', color: 'amber-600', description: 'Manage damage classifications for tire scrap reporting' },
    { name: 'Tyre Database', icon: '🛞', color: 'green-600', description: 'Manage tire inventory database' },
    { name: 'Vehicle Configuration Database', icon: '🚚', color: 'purple-600', description: 'Configure vehicle types and settings' },
    { name: 'Company Database', icon: '🏢', color: 'orange-600', description: 'Manage company information' },
    { name: 'Depot Database', icon: '📍', color: 'red-600', description: 'Manage depot locations and details' },
    { name: 'User Database', icon: '👥', color: 'indigo-600', description: 'Manage system users and permissions' },
  ];

  const colorMap = {
    'blue-600': 'bg-blue-600',
    'cyan-600': 'bg-cyan-600',
    'amber-600': 'bg-amber-600',
    'green-600': 'bg-green-600',
    'purple-600': 'bg-purple-600',
    'orange-600': 'bg-orange-600',
    'red-600': 'bg-red-600',
    'indigo-600': 'bg-indigo-600',
  };

  return (
    <div className="flex flex-col p-6 bg-gray-50 min-h-screen dark:bg-gray-900 gap-4">
      {/* Header Section */}
      <div className="border-l-4 border-blue-500 pl-6 py-4 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900 dark:to-transparent rounded-r-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Administrator Panel</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage system configuration and databases</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        {tabs.map(tab => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === tab.name
                ? `${colorMap[tab.color]} text-white shadow-lg transform scale-105`
                : `bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600`
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="border-l-4 border-green-500 pl-6 py-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900 dark:to-transparent rounded-r-lg m-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeTab}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {tabs.find(tab => tab.name === activeTab)?.description}
          </p>
        </div>

        <div className="p-6">
          {activeTab === 'Vehicle Configuration Database' ? (
            <VehicleConfigBuilder />
          ) : activeTab === 'User Suggestions' ? (
            <SuggestionsPanel user={user} />
          ) : activeTab === 'Scrap Data' ? (
            <ScrapDataPanel />
          ) : activeTab === 'Tyre Database' ? (
            <AdminPanel />
          ) : (
            <TabbedDatabasePanel activeTab={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

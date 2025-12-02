// Zuri/client/src/components/Header.js
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Header({ user, onLogout, toggleDarkMode, isDark }) {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { label: 'Dashboard', path: '/' },
    { label: 'Home', path: '/home' },
    { label: 'Inspections', path: '/inspections' },
    { label: 'Reports', path: '/reports' },
    { label: 'Scrap', path: '/scrap' },
    ...(user?.role === 'Administrator' ? [{ label: 'Admin', path: '/admin-dashboard' }] : []),
  ];

  const fallback = '/default-avatar.png'; // Replace this with your actual placeholder image or keep it empty

  return (
    <header className="flex items-center justify-between px-6 py-3 shadow-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
      <div className="flex gap-4 items-center">
        <h1 className="font-bold text-xl tracking-tight">Zuri Tire Inspection</h1>
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`px-3 py-2 rounded-md font-medium ${location.pathname === tab.path
              ? 'bg-blue-500 text-white dark:bg-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Profile Picture */}
      <div className="flex items-center gap-4">
        <img
          src={user?.avatarUrl || fallback}
          alt="Profile"
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 dark:border-gray-600"
        />

        {/* Settings and Logout */}
        <button
          onClick={toggleDarkMode}
          className="text-sm px-2 py-1 border rounded dark:border-white border-gray-800"
        >
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={onLogout}
          className="text-sm px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

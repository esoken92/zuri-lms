// Zuri/client/src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InspectionsPage from './pages/InspectionsPage';
import ReportPage from './pages/ReportPage';
import Reports from './pages/Reports';
import ScrapPage from './pages/ScrapPage';
import SyncStatusBar from './components/SyncStatusBar';
import useSyncPending from './hooks/useSyncPending';
import AdminPanel from './pages/AdminPanel';
import AdminDashboard from './pages/admin/AdminDashboard';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import { getCurrentUser, logout } from './api';
import { isAdmin } from './utils/rolePermissions';
import ResetPasswordPage from './ResetPasswordPage';
import Header from './components/Header';
import UserSettingsPanel from './components/UserSettingsPanel';
import ErrorBoundary from './components/ErrorBoundary';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const {
    isOnline,
    syncing,
    pendingCount,
    forceSync,
    syncAttempt,
    lastSyncStatus
  } = useSyncPending();

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // Fetch developer mode flag from backend so the UI can show dev-only features
    fetch(`${API_BASE}/api/developer-mode`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.isDeveloperMode) {
          setIsDeveloperMode(true);
          window.__ZURI_DEVELOPER_MODE = true;
        } else {
          setIsDeveloperMode(false);
          window.__ZURI_DEVELOPER_MODE = false;
        }
      })
      .catch(() => {
        setIsDeveloperMode(false);
        window.__ZURI_DEVELOPER_MODE = false;
      });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  if (loading) return <p className="p-4">Loading Zuri App...</p>;

  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        {isDeveloperMode && (
          <div className="bg-yellow-200 text-yellow-900 p-2 text-center font-medium">
            Developer Mode Enabled
          </div>
        )}

        {user && (
          <Header
            user={user}
            onLogout={async () => {
              await logout();
              setUser(null);
            }}
            toggleDarkMode={toggleDarkMode}
            isDark={isDark}
          />
        )}

        <SyncStatusBar
          syncing={syncing}
          pendingCount={pendingCount}
          forceSync={forceSync}
          isOnline={isOnline}
          syncAttempt={syncAttempt}
          lastSyncStatus={lastSyncStatus}
        />

        <Routes>
          {user ? (
            <>
              <Route path="/" element={<Dashboard user={user} onLogout={() => setUser(null)} />} />
              <Route path="/inspections" element={<InspectionsPage user={user} />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/scrap" element={<ScrapPage user={user} />} />
              <Route path="/report-page" element={<ReportPage />} />
              {isAdmin(user) ? (
                <Route path="/admin" element={<AdminPanel />} />
              ) : (
                // Non-admin users should not access the admin panel
                <Route path="/admin" element={<Navigate to="/" />} />
              )}
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              {user.role === 'Administrator' && (
                <Route
                  path="/admin-dashboard"
                  element={<AdminDashboard user={user} onLogout={() => setUser(null)} />}
                />
              )}
              <Route path="/settings" element={<UserSettingsPanel user={user} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginPage onLogin={setUser} isDeveloperMode={isDeveloperMode} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InspectionForm from './components/InspectionForm';
import ReportPage from './pages/ReportPage';
import Reports from './pages/Reports';
import SyncStatusBar from './components/SyncStatusBar';
import useSyncPending from './hooks/useSyncPending';
import AdminPanel from './pages/AdminPanel';
import AdminDashboard from './pages/admin/AdminDashboard';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import { getCurrentUser, logout } from './api';
import ResetPasswordPage from './ResetPasswordPage';
import Header from './components/Header';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

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
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  if (loading) return <p className="p-4">Loading Zuri App...</p>;

  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
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
              <Route path="/" element={<InspectionForm />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/report-page" element={<ReportPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              {user.role === 'Administrator' && (
                <Route
                  path="/admin-dashboard"
                  element={<AdminDashboard user={user} onLogout={() => setUser(null)} />}
                />
              )}
              <Route path="/dashboard" element={<Dashboard user={user} onLogout={() => setUser(null)} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginPage onLogin={setUser} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

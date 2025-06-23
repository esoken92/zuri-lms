
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
import { getCurrentUser } from './api';
import ResetPasswordPage from './ResetPasswordPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading Zuri App...</p>;

  return (
    <Router>
      <div style={{ padding: '1rem', background: '#eee' }}>
        <h2>Zuri Tire Inspection</h2>
      </div>

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
              <Route path="/admin-dashboard" element={<AdminDashboard user={user} onLogout={() => setUser(null)} />} />
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
    </Router>
  );
}

export default App;


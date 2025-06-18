import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import InspectionForm from './components/InspectionForm';
import ReportPage from './pages/ReportPage';
import Reports from './pages/Reports';
import SyncStatusBar from './components/SyncStatusBar';
import useSyncPending from './hooks/useSyncPending';

function App() {
  const { isOnline, syncing, pendingCount, forceSync } = useSyncPending();

  return (
    <Router>
      <div style={{ padding: '1rem', background: '#eee' }}>
        <h2>Zuri Tire Inspection</h2>
        <nav style={{ marginBottom: '1rem' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
          <Link to="/reports" style={{ marginRight: '1rem' }}>Reports</Link>
          <Link to="/report-page">Full Report</Link>
        </nav>
      </div>

      <SyncStatusBar
        syncing={syncing}
        pendingCount={pendingCount}
        forceSync={forceSync}
        isOnline={isOnline}
      />

      <Routes>
        <Route path="/" element={<InspectionForm />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/report-page" element={<ReportPage />} />
      </Routes>
    </Router>
  );
}

export default App;

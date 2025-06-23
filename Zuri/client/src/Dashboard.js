import React, { useState } from 'react';
import TableViewer from './TableViewer';
import { logout } from './api';

const TABS = ['tyres', 'vehicles', 'companies', 'depots', 'users'];

export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div>
      <h2>Zuri Admin – Logged in as {user.username} ({user.role})</h2>
      <button onClick={() => logout().then(onLogout)}>Logout</button>

      <div style={{ margin: '10px 0' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} disabled={tab === t}>
            {t}
          </button>
        ))}
      </div>

      <TableViewer key={tab} table={tab} user={user} />
    </div>
  );
}

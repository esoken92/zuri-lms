import React from 'react';

function SyncStatusBar({ syncing, pendingCount, forceSync, isOnline }) {
  let bgColor = '#ccc';
  let text = 'Offline';

  if (isOnline && pendingCount === 0 && !syncing) {
    bgColor = 'green';
    text = 'Up to date';
  } else if (syncing) {
    bgColor = 'orange';
    text = 'Syncing...';
  } else if (isOnline && pendingCount > 0) {
    bgColor = 'gold';
    text = `${pendingCount} pending sync`;
  } else {
    bgColor = 'red';
    text = 'Offline';
  }

  return (
    <div style={{
      backgroundColor: bgColor,
      color: '#fff',
      padding: '0.5rem 1rem',
      textAlign: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <strong>Status:</strong> {text} {' '}
      <button onClick={forceSync} style={{ marginLeft: '1rem' }}>Sync Now</button>
    </div>
  );
}

export default SyncStatusBar;

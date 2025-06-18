import { useState, useEffect } from 'react';

function useSyncPending() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPending = () => {
    const stored = JSON.parse(localStorage.getItem('zuri-pending') || '[]');
    setPendingCount(stored.length);
    return stored;
  };

  const forceSync = async () => {
    const pending = checkPending();
    if (!navigator.onLine || pending.length === 0) return;

    setSyncing(true);

    const synced = [];
    for (const item of pending) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/inspections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (res.ok) synced.push(item);
      } catch (e) {
        console.error('Sync failed for item:', item);
      }
    }

    if (synced.length > 0) {
      const updated = pending.filter(i => !synced.includes(i));
      localStorage.setItem('zuri-pending', JSON.stringify(updated));
      setPendingCount(updated.length);
    }

    setSyncing(false);
  };

  useEffect(() => {
    checkPending();
    const interval = setInterval(() => {
      if (navigator.onLine) forceSync();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return { isOnline, syncing, pendingCount, forceSync };
}

export default useSyncPending;

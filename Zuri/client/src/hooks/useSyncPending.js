import { useState, useEffect, useRef } from 'react';
import { syncOfflineDrafts } from '../services/drafts';

function useSyncPending() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const [lastSyncStatus, setLastSyncStatus] = useState(null);

  const failCountRef = useRef(0);
  const cooldownTimeoutRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[SYNC] Device came online - attempting to sync pending data...');
      // Trigger sync when device comes back online
      setTimeout(() => forceSync(), 500);
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log('[SYNC] Device went offline - queuing changes locally');
    };

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

  const startCooldown = () => {
    setCooldownActive(true);
    alert("Sync paused after 10 failed attempts. Will retry in 10 minutes.");
    cooldownTimeoutRef.current = setTimeout(() => {
      setCooldownActive(false);
      failCountRef.current = 0;
    }, 10 * 60 * 1000);
  };

  const forceSync = async () => {
    const pending = checkPending();
    if (!navigator.onLine || (pending.length === 0) || cooldownActive) return;

    setSyncing(true);
    setSyncAttempt(0);

    const synced = [];
    let draftSyncResult = null;

    // First, sync offline drafts
    try {
      console.log('[SYNC] Syncing offline drafts...');
      draftSyncResult = await syncOfflineDrafts();
      console.log(`[SYNC] Draft sync complete: ${draftSyncResult.synced} synced, ${draftSyncResult.errors.length} errors`);
    } catch (err) {
      console.error('[SYNC] Draft sync failed:', err);
    }

    // Then sync inspection/scrap data
    for (const item of pending) {
      const currentAttempt = failCountRef.current + 1;
      setSyncAttempt(currentAttempt);

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/inspections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(item),
        });

        if (res.ok) {
          synced.push(item);
        } else {
          throw new Error('Server rejected request');
        }
      } catch (e) {
        console.error(`Attempt ${currentAttempt} failed for:`, item);
        failCountRef.current = currentAttempt;

        if (failCountRef.current >= 10) {
          setLastSyncStatus('error');
          startCooldown();
          break;
        }
      }
    }

    if (synced.length > 0) {
      const updated = pending.filter(i => !synced.includes(i));
      localStorage.setItem('zuri-pending', JSON.stringify(updated));
      setPendingCount(updated.length);
      failCountRef.current = 0;
      setLastSyncStatus('success');
    } else if (failCountRef.current > 0) {
      setLastSyncStatus('error');
    } else if (draftSyncResult?.synced > 0) {
      // Drafts synced successfully even if no pending inspections
      setLastSyncStatus('success');
    }

    setSyncing(false);
    setSyncAttempt(0);

    // Auto-clear toast after 3s
    setTimeout(() => setLastSyncStatus(null), 3000);
  };

  useEffect(() => {
    checkPending();
    const interval = setInterval(() => {
      if (navigator.onLine && !cooldownActive) {
        forceSync();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [cooldownActive]);

  return {
    isOnline,
    syncing,
    pendingCount,
    forceSync,
    syncAttempt,
    lastSyncStatus,
    setLastSyncStatus,
  };
}

export default useSyncPending;
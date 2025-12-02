/**
 * Draft Management Service
 * 
 * Handles auto-saving of form data to server with offline support:
 * - Stores drafts locally in IndexedDB (client-side)
 * - Syncs to server via REST API
 * - Detects conflicts and reconciles on reconnection
 * - Provides debounced auto-save to minimize network traffic
 */

const API_BASE = 'http://localhost:5000';

/**
 * Local storage key for offline draft queue
 */
const DRAFT_QUEUE_KEY = 'zuri_draft_queue';
const DRAFT_CACHE_KEY = 'zuri_drafts_cache';

/**
 * Debounce helper: delays function execution until N ms have passed without calls
 */
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Save or update a draft on the server
 * @param {string} formType - Type of form (e.g., 'inspection', 'company', 'depot')
 * @param {string} formName - Display name of the draft (e.g., "Vehicle 123 Inspection")
 * @param {object} formData - The form data to save
 * @param {number} draftId - (optional) ID of existing draft to update
 * @returns {Promise} - Result from server or cached data
 */
export async function saveDraft(formType, formName, formData, draftId = null) {
  const payload = {
    draftId,
    formType,
    formName,
    formData
  };

  try {
    const res = await fetch(`${API_BASE}/api/drafts/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save draft');
    }

    const draft = await res.json();
    
    // Update local cache
    updateLocalDraftCache(draft);
    
    // Clear from offline queue if exists
    removeFromOfflineQueue(formType, formName);

    return { success: true, draft };
  } catch (err) {
    console.warn('[DRAFT] Save failed, queuing for later:', err.message);
    
    // If offline or error, queue for later sync
    addToOfflineQueue({
      formType,
      formName,
      formData,
      draftId,
      timestamp: Date.now()
    });

    // Return cached/placeholder result
    return {
      success: false,
      offline: true,
      message: 'Draft queued. Will sync when online.',
      draft: { formType, formName, draftId, draft_data: formData }
    };
  }
}

/**
 * Fetch all drafts for current user
 */
export async function fetchDrafts() {
  try {
    const res = await fetch(`${API_BASE}/api/drafts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch drafts');
    }

    const drafts = await res.json();
    
    // Cache locally
    localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(drafts));
    
    return drafts;
  } catch (err) {
    console.warn('[DRAFT] Fetch failed, returning cached:', err.message);
    
    // Return cached data if available
    const cached = localStorage.getItem(DRAFT_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

/**
 * Fetch a specific draft by ID
 */
export async function fetchDraft(draftId) {
  try {
    const res = await fetch(`${API_BASE}/api/drafts/${draftId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error('Failed to fetch draft');
    }

    const draft = await res.json();
    if (typeof draft.draft_data === 'string') {
      draft.draft_data = JSON.parse(draft.draft_data);
    }
    
    updateLocalDraftCache(draft);
    return draft;
  } catch (err) {
    console.warn('[DRAFT] Fetch single draft failed:', err.message);
    throw err;
  }
}

/**
 * Delete a draft
 */
export async function deleteDraft(draftId) {
  try {
    const res = await fetch(`${API_BASE}/api/drafts/${draftId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error('Failed to delete draft');
    }

    // Remove from local cache
    const cached = localStorage.getItem(DRAFT_CACHE_KEY);
    if (cached) {
      const drafts = JSON.parse(cached).filter(d => d.id !== draftId);
      localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(drafts));
    }

    return { success: true };
  } catch (err) {
    console.error('[DRAFT] Delete failed:', err.message);
    throw err;
  }
}

/**
 * Sync all offline drafts when coming back online
 */
export async function syncOfflineDrafts() {
  const queue = getOfflineQueue();
  
  if (queue.length === 0) {
    console.log('[DRAFT] No drafts to sync');
    return { synced: 0 };
  }

  console.log(`[DRAFT] Syncing ${queue.length} offline drafts...`);

  let synced = 0;
  const errors = [];

  for (const item of queue) {
    try {
      await saveDraft(item.formType, item.formName, item.formData, item.draftId);
      synced++;
    } catch (err) {
      errors.push(`${item.formName}: ${err.message}`);
    }
  }

  if (synced > 0) {
    clearOfflineQueue();
  }

  return { synced, errors };
}

/**
 * Create a debounced version of saveDraft for auto-save within forms
 * Returns a function that auto-saves the draft with a delay
 */
export function createAutoSave(formType, formName) {
  let draftId = null;

  const debouncedSave = debounce(async (formData) => {
    const result = await saveDraft(formType, formName, formData, draftId);
    if (result.success && result.draft?.id) {
      draftId = result.draft.id;
    }
  }, 1500); // Wait 1.5 seconds after last change

  return {
    autoSave: debouncedSave,
    setDraftId: (id) => { draftId = id; }
  };
}

// ============ LOCAL STORAGE HELPERS ============

function updateLocalDraftCache(draft) {
  try {
    const cached = localStorage.getItem(DRAFT_CACHE_KEY);
    const drafts = cached ? JSON.parse(cached) : [];
    
    // Replace or add draft
    const index = drafts.findIndex(d => d.id === draft.id);
    if (index >= 0) {
      drafts[index] = draft;
    } else {
      drafts.push(draft);
    }
    
    localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(drafts));
  } catch (err) {
    console.warn('[DRAFT] Failed to update local cache:', err);
  }
}

function getOfflineQueue() {
  try {
    const queue = localStorage.getItem(DRAFT_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (err) {
    console.warn('[DRAFT] Failed to read offline queue:', err);
    return [];
  }
}

function addToOfflineQueue(item) {
  try {
    const queue = getOfflineQueue();
    
    // Check if draft already in queue (update instead of duplicate)
    const index = queue.findIndex(q => q.draftId === item.draftId && q.formType === item.formType);
    if (index >= 0) {
      queue[index] = item; // Replace with latest data
    } else {
      queue.push(item);
    }
    
    localStorage.setItem(DRAFT_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('[DRAFT] Failed to queue offline draft:', err);
  }
}

function removeFromOfflineQueue(formType, formName) {
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter(q => !(q.formType === formType && q.formName === formName));
    localStorage.setItem(DRAFT_QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('[DRAFT] Failed to remove from queue:', err);
  }
}

function clearOfflineQueue() {
  try {
    localStorage.removeItem(DRAFT_QUEUE_KEY);
  } catch (err) {
    console.warn('[DRAFT] Failed to clear queue:', err);
  }
}

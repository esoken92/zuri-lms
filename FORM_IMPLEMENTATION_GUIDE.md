# How to Add Draft Auto-Save to Your Forms

This guide shows exactly how to add the draft/sync system to form components.

---

## Example 1: Inspection Form (Most Common)

### Before (Without Drafts)
```javascript
import React, { useState } from 'react';

export default function InspectionForm() {
  const [formData, setFormData] = useState({
    vehicleId: '',
    location: '',
    tires: [],
    notes: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/inspections', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="vehicleId" value={formData.vehicleId} onChange={handleChange} />
      <input name="location" value={formData.location} onChange={handleChange} />
      <textarea name="notes" value={formData.notes} onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### After (With Draft Auto-Save)
```javascript
import React, { useState, useEffect } from 'react';
import { createAutoSave, fetchDraft } from '../services/drafts';

export default function InspectionForm() {
  const [formData, setFormData] = useState({
    vehicleId: '',
    location: '',
    tires: [],
    notes: ''
  });
  const [draftId, setDraftId] = useState(null);
  
  // Step 1: Create auto-save function
  const { autoSave, setDraftId: linkDraftId } = createAutoSave(
    'inspection',
    'Inspection Form'
  );

  // Step 2: Restore draft on component load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftIdParam = urlParams.get('draftId');
    
    if (draftIdParam) {
      fetchDraft(draftIdParam).then(draft => {
        setFormData(draft.draft_data);
        setDraftId(draft.id);
        linkDraftId(draft.id);
      });
    }
  }, []);

  // Step 3: Call auto-save on every change (debounced automatically)
  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    // Auto-save happens after 1.5 seconds of no changes
    autoSave(newData);
  };

  // Step 4: Submit final inspection
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First save as draft
    const draftResult = await autoSave(formData);
    if (draftResult.success && !draftId) {
      linkDraftId(draftResult.draft.id);
      setDraftId(draftResult.draft.id);
    }
    
    // Then submit inspection
    const submitResult = await fetch('/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (submitResult.ok) {
      alert('Inspection submitted!');
      // Clear draft after successful submit (optional)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        name="vehicleId" 
        value={formData.vehicleId} 
        onChange={handleChange}
        placeholder="Vehicle ID"
      />
      <input 
        name="location" 
        value={formData.location} 
        onChange={handleChange}
        placeholder="Location"
      />
      <textarea 
        name="notes" 
        value={formData.notes} 
        onChange={handleChange}
        placeholder="Notes"
      />
      <button type="submit">Submit Inspection</button>
      {draftId && <span>Auto-saving to draft #{draftId}...</span>}
    </form>
  );
}
```

---

## Example 2: Company Form

### Implementation
```javascript
import { useState, useEffect } from 'react';
import { createAutoSave, fetchDraft } from '../services/drafts';

export default function CompanyForm() {
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: ''
  });
  const [draftId, setDraftId] = useState(null);
  
  const { autoSave, setDraftId: linkDraftId } = createAutoSave('company', 'Company Form');

  // Restore draft if editing existing
  useEffect(() => {
    const draftIdParam = new URLSearchParams(location.search).get('draftId');
    if (draftIdParam) {
      fetchDraft(draftIdParam).then(draft => {
        setFormData(draft.draft_data);
        setDraftId(draft.id);
        linkDraftId(draft.id);
      });
    }
  }, []);

  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    autoSave(newData); // Auto-saves after 1.5s
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Save as draft first
    const draft = await autoSave(formData);
    if (draft.success && !draftId) {
      setDraftId(draft.draft.id);
      linkDraftId(draft.draft.id);
    }
    
    // Then submit to database
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      alert('Company saved!');
      setFormData({ name: '', contactName: '', email: '', phone: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Company Name" required />
      <input name="contactName" value={formData.contactName} onChange={handleChange} placeholder="Contact Name" />
      <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" type="email" />
      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />
      <button type="submit">Save Company</button>
    </form>
  );
}
```

---

## Example 3: Depot Form

### Implementation
```javascript
import { useState, useEffect } from 'react';
import { createAutoSave, fetchDraft } from '../services/drafts';

export default function DepotForm() {
  const [formData, setFormData] = useState({
    location: '',
    contactName: '',
    email: '',
    phone: '',
    companyId: null
  });
  const [draftId, setDraftId] = useState(null);
  
  const { autoSave, setDraftId: linkDraftId } = createAutoSave('depot', 'Depot Form');

  useEffect(() => {
    const draftIdParam = new URLSearchParams(location.search).get('draftId');
    if (draftIdParam) {
      fetchDraft(draftIdParam).then(draft => {
        setFormData(draft.draft_data);
        setDraftId(draft.id);
        linkDraftId(draft.id);
      });
    }
  }, []);

  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    autoSave(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const draft = await autoSave(formData);
    if (draft.success && !draftId) {
      setDraftId(draft.draft.id);
      linkDraftId(draft.draft.id);
    }
    
    const res = await fetch('/api/depots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      alert('Depot saved!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />
      <input name="contactName" value={formData.contactName} onChange={handleChange} placeholder="Contact Name" />
      <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" type="email" />
      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />
      <input name="companyId" value={formData.companyId || ''} onChange={handleChange} placeholder="Company ID" type="number" />
      <button type="submit">Save Depot</button>
    </form>
  );
}
```

---

## What Happens in Each Step

### Step 1: Create Auto-Save Function
```javascript
const { autoSave, setDraftId: linkDraftId } = createAutoSave('inspection', 'Inspection Form');
```
- Creates a debounced save function
- `autoSave` = the function you call on change
- `setDraftId` = link function to mark future saves as updates

### Step 2: Restore Existing Draft
```javascript
useEffect(() => {
  const draftId = new URLSearchParams(location.search).get('draftId');
  if (draftId) {
    fetchDraft(draftId).then(draft => {
      setFormData(draft.draft_data);  // Restore form data
      setDraftId(draft.id);            // Remember this draft ID
      linkDraftId(draft.id);          // Tell auto-save to update, not create
    });
  }
}, []);
```

**Flow:**
- User clicks "Edit Draft #42"
- URL: `/form?draftId=42`
- Component fetches from server
- Form data restored
- Auto-save now updates existing draft

### Step 3: Auto-Save on Change
```javascript
const handleChange = (e) => {
  const newData = { ...formData, [e.target.name]: e.target.value };
  setFormData(newData);
  autoSave(newData); // <-- Debounced! Waits 1.5s
};
```

**Flow:**
- User types in field
- `handleChange` called immediately
- `autoSave()` called immediately (but debounced)
- 1.5 seconds later (or when user stops typing):
  - `POST /api/drafts/save` with latest data
  - Server saves to `user_drafts` table
  - Browser cache updated
  - If offline, queued locally

### Step 4: Submit Form
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Ensure draft is saved
  const draft = await autoSave(formData);
  if (draft.success && !draftId) {
    setDraftId(draft.draft.id);
    linkDraftId(draft.draft.id);
  }
  
  // Submit inspection/company/depot
  const res = await fetch('/api/inspections', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
};
```

**Flow:**
- User clicks Submit
- Force a final draft save (waits if debounced)
- Link draft ID if first time
- Submit to actual endpoint
- Clear form or show success

---

## Offline Behavior

### Scenario: User Goes Offline While Filling Form

1. **User is online, filling form**
   - Auto-save works normally
   - Drafts saved to server every 1.5s
   - Browser cache updated

2. **User goes offline (closes laptop, leaves WiFi)**
   - User keeps typing
   - Auto-save tries to POST
   - POST fails (no network)
   - Data queued to `localStorage` under `zuri_draft_queue`
   - User sees message: "Draft queued. Will sync when online."

3. **User comes back online**
   - Browser detects `online` event
   - `useSyncPending` automatically triggers
   - `syncOfflineDrafts()` runs
   - Queued drafts POST to `/api/drafts/save`
   - Server saves them
   - Browser clears queue
   - User sees sync notification

4. **On another device**
   - User opens `/drafts`
   - Sees list of all drafts (from server)
   - Clicks draft → Opens form with `?draftId=42`
   - Form data restored
   - Can continue editing

---

## Testing Your Implementation

### Test 1: Auto-Save Works
1. Open form
2. Fill in a field
3. Open DevTools → Console
4. Wait 2 seconds
5. Check browser Network tab → `POST /api/drafts/save` completed
6. ✅ Working

### Test 2: Offline Auto-Queue
1. Open form (online)
2. Fill data → watch it auto-save
3. Go offline (DevTools → Network → Offline)
4. Fill more data
5. Open DevTools → Application → Local Storage
6. Check `zuri_draft_queue` has entry
7. ✅ Working

### Test 3: Auto-Sync on Reconnect
1. (Continue from Test 2, offline with queued data)
2. Go online (toggle Offline off)
3. Watch Network tab
4. Should see `POST /api/drafts/save` fire automatically
5. Check `zuri_draft_queue` → now empty
6. ✅ Working

### Test 4: Cross-Device Load
1. Device A: Create draft, auto-save happens
2. Device B: Open `/drafts` page
3. See new draft in list
4. Click to open → Form loads with data
5. ✅ Working

---

## Common Patterns

### Pattern 1: Complex Objects in Form
```javascript
const [formData, setFormData] = useState({
  vehicle: { id: '', name: '' },
  tires: [
    { position: 1, pressure: 0, wear: 0 }
  ]
});

const handleTireChange = (index, field, value) => {
  const newTires = [...formData.tires];
  newTires[index][field] = value;
  const newData = { ...formData, tires: newTires };
  setFormData(newData);
  autoSave(newData); // Entire object with array auto-saves
};
```

### Pattern 2: Different Draft Names Based on Context
```javascript
const vehicleId = formData.vehicleId || 'New Vehicle';
const { autoSave } = createAutoSave('inspection', `Inspection: ${vehicleId}`);
// Draft name updates as user fills form
```

### Pattern 3: Conditional Auto-Save
```javascript
const handleChange = (e) => {
  const newData = { ...formData, [e.target.name]: e.target.value };
  setFormData(newData);
  
  // Only auto-save if at least minimal data exists
  if (newData.vehicleId && newData.location) {
    autoSave(newData);
  }
};
```

---

## Troubleshooting

### "Draft not saving"
1. Check browser Network tab → Is POST to `/api/drafts/save` happening?
2. Check DevTools Console → Any errors?
3. Check browser Storage → Is `zuri_drafts_cache` updated?
4. Check server logs → `server/logs/{username}/activity_*.log`

### "Data lost after page refresh"
1. Check `user_drafts` table: `SELECT * FROM user_drafts WHERE user_id = X;`
2. If empty, check if auto-save was working (Network tab)
3. If offline, check `zuri_draft_queue` in localStorage

### "Form not restoring draft"
1. Check URL → Does it have `?draftId=42`?
2. Check browser Network → Is `GET /api/drafts/42` happening?
3. Check response → Does `draft_data` contain expected data?

---

## Ready to Implement?

1. Pick a form (InspectionForm, CompanyForm, or DepotForm)
2. Copy the "After" code from above
3. Replace import with your actual path
4. Test the 4 test scenarios above
5. Repeat for other forms

**Questions?** Check `SECURITY_AND_SYNC_IMPROVEMENTS.md` → Part 2.3 for full API reference

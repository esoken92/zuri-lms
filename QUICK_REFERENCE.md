# ZURI Security & Draft Sync - Quick Reference

## What Changed

### 🔐 Security Fixes (Backend)

| Issue | Solution | Impact |
|-------|----------|--------|
| Hardcoded session secret | Crypto-random secret from env var | Session hijacking prevented |
| No file upload validation | Whitelist MIME types, 10MB limit | Malicious file uploads blocked |
| Passwords logged to DB | Sanitize sensitive fields | No passwords in audit trail |
| Any table accessible | Whitelist only: scraps, inspections, etc. | System tables protected |
| No auth on uploads | Added `requireLogin` middleware | Upload access restricted |

### 📦 New: Draft Storage System

**What it does:**
- Saves form data to server automatically while typing (debounced)
- Works offline - queues changes locally
- Syncs to server automatically when back online
- Allows switching devices and picking up where you left off

**New Database Table:**
```sql
user_drafts
├── id (PK)
├── user_id (FK to users)
├── form_type (inspection|company|depot)
├── form_name (user-friendly name)
├── draft_data (JSONB - the actual form data)
├── sync_status (pending|synced)
└── last_saved (timestamp)
```

**New API Endpoints:**
- `GET /api/drafts` - List all user's drafts
- `POST /api/drafts/save` - Create/update draft
- `GET /api/drafts/:id` - Fetch specific draft
- `DELETE /api/drafts/:id` - Delete draft

**New Files:**
- `client/src/services/drafts.js` - Draft API client
- Updated: `client/src/hooks/useSyncPending.js` - Auto-sync on reconnect

---

## How to Use (For Form Developers)

### Step 1: Import the Service
```javascript
import { createAutoSave, fetchDraft } from '../services/drafts';
```

### Step 2: Setup Auto-Save in Component
```javascript
const { autoSave, setDraftId } = createAutoSave('inspection', 'Vehicle ABC-123');
```

### Step 3: Call Auto-Save on Change
```javascript
const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
  autoSave({ ...formData, [e.target.name]: e.target.value }); // Debounced
};
```

### Step 4: Link Draft ID After First Save
```javascript
async function handleSaveForm() {
  const result = await saveDraft('inspection', 'Vehicle ABC-123', formData);
  if (result.success) {
    setDraftId(result.draft.id); // Now updates existing draft
  }
}
```

### Step 5: Restore Draft on Load
```javascript
useEffect(() => {
  const draftId = new URLSearchParams(location.search).get('draftId');
  if (draftId) {
    fetchDraft(draftId).then(draft => {
      setFormData(draft.draft_data);
      setDraftId(draft.id);
    });
  }
}, []);
```

---

## Testing Checklist

### Security Tests
- [ ] Upload `.exe` → Should be rejected
- [ ] Upload `.jpg` → Should succeed
- [ ] Access `/api/table/user_activity_log` → Should return 403
- [ ] Access `/api/table/inspections` → Should return 200 OK
- [ ] Check uploaded filenames are randomized (not original)

### Offline Tests
1. Open form while **online**
2. Fill in some data (should auto-save every 1.5s)
3. Go **offline** (DevTools → Network → Offline)
4. Fill in more data
5. Open DevTools → Application → Local Storage
6. Check `zuri_draft_queue` has an entry
7. Go back **online**
8. Watch automatic sync happen (~10 seconds)
9. Check database: `SELECT * FROM user_drafts WHERE user_id = X;`

### Cross-Device Tests
1. Desktop: Start form, enter data, app auto-saves draft
2. Mobile: Go to `/drafts` page
3. Should see draft listed
4. Click to open → Data restored from server
5. Add more data on mobile → Auto-saves
6. Desktop: Refresh `/drafts` → Should see updated data

---

## Environment Variables

### Development
```bash
# Optional - uses random secret if not set
# (but resets on server restart)
export SESSION_SECRET=dev-key-123

node server.js
```

### Production
```bash
# REQUIRED - generate once and save
export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
export NODE_ENV=production
export PGUSER=postgres
export PGPASSWORD=****
export PGHOST=your-db-host
export PGPORT=5432
export PGDATABASE=zuri

node server.js
```

---

## Files Modified

### Server (`server/server.js`)
- ✅ Added `const crypto = require('crypto')`
- ✅ Session secret now `crypto.randomBytes(32).toString('hex')`
- ✅ Cookie security flags added (httpOnly, sameSite, secure)
- ✅ Multer file upload validation (MIME type, size)
- ✅ `sanitizeForLogging()` function added
- ✅ Activity logging now sanitizes sensitive fields
- ✅ Table whitelist validation added
- ✅ Security headers added to all responses
- ✅ `user_drafts` table migration added
- ✅ Draft API endpoints added (GET, POST, DELETE)

### Client (`client/src/`)
- ✅ New file: `services/drafts.js` (draft API client)
- ✅ Updated: `hooks/useSyncPending.js` (added draft sync)

---

## Performance Notes

- **Auto-save debounce:** 1500ms (1.5 seconds) after last change
- **Sync interval:** 10 seconds (when online)
- **Max file size:** 10MB
- **Storage per draft:** ~2KB average

---

## Debugging

### Check Active Drafts
```javascript
// In browser console
JSON.parse(localStorage.getItem('zuri_drafts_cache'))
```

### Check Offline Queue
```javascript
// In browser console
JSON.parse(localStorage.getItem('zuri_draft_queue'))
```

### Server Logs
```bash
# Activity logs per user
tail -f server/logs/{username}/activity_*.log
```

### Database Query
```sql
-- See all drafts for a user
SELECT id, form_type, form_name, last_saved, sync_status 
FROM user_drafts 
WHERE user_id = 5
ORDER BY last_saved DESC;

-- See draft content
SELECT draft_data FROM user_drafts WHERE id = 42;
```

---

## Common Issues

### Issue: "Draft saved but not syncing"
**Solution:**
1. Check network (DevTools → Network)
2. Verify `SESSION_SECRET` is set
3. Check browser console for errors
4. Verify `/api/drafts/save` returns 200

### Issue: "Data lost after page refresh"
**Solution:**
1. Check `zuri_draft_queue` in localStorage (offline)
2. If empty, check server `user_drafts` table
3. Verify device is online before refresh

### Issue: "File upload rejected"
**Solution:**
1. Only `.jpg, .jpeg, .png, .gif, .webp` allowed
2. Max size 10MB
3. Verify file MIME type is correct

---

## Next Steps

1. **Build frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Start server:**
   ```bash
   cd server
   export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   node server.js
   ```

3. **Integrate draft service into forms:**
   - Update `InspectionForm.js` with auto-save
   - Update `CompanyForm.js` with auto-save
   - Update `DepotForm.js` with auto-save

4. **Test offline scenarios:**
   - Go offline, make changes, check queue
   - Come back online, verify sync

5. **Deploy to production:**
   - Set environment variables
   - Enable HTTPS
   - Update CORS origins

---

## Full Documentation

See `SECURITY_AND_SYNC_IMPROVEMENTS.md` for detailed information on:
- Architecture and data flow
- API reference with curl examples
- Implementation guide with code examples
- Performance tuning
- Future enhancements

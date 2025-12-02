# ZURI Backend - Testing Quick Reference

## 🚀 One-Minute Setup

```bash
cd Zuri/server
npm install
node server.js
```

**Expected:** Server running at `http://localhost:5000`

---

## ✅ Five Essential Tests

### 1. Upload File
```bash
curl -X POST http://localhost:5000/upload \
  -F "photo=@test.jpg"
```
✓ Should return URL in `uploads/` directory

### 2. Submit Inspection
```bash
curl -X POST http://localhost:5000/inspections \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"123","tireCondition":"Good"}'
```
✓ Should return: `{"message":"Inspection saved"}`

### 3. Check Database
```bash
psql -h localhost -p 54321 -U postgres -d zuri \
  -c "SELECT COUNT(*) FROM inspections;"
```
✓ Should show row count

### 4. Check Logs
```bash
cat server/logs/anonymous/activity_$(date +%Y-%m-%d).log
```
✓ Should show upload and inspection entries

### 5. Check Uploaded Files
```bash
ls -la server/uploads/
```
✓ Should show uploaded image files

---

## 📊 Full Workflow Test

1. **Upload Photo:**
   - Command: `curl -X POST http://localhost:5000/upload -F "photo=@image.jpg"`
   - Check: File in `server/uploads/`
   - Check: Log shows `[UPLOAD] Photo saved`

2. **Submit Inspection:**
   - Command: Use returned URL from step 1
   - Check: Response shows `Inspection saved`
   - Check: Log shows `[INSPECT] Inspection saved successfully`

3. **Verify Database:**
   - Command: `psql -c "SELECT * FROM inspections LIMIT 1;"`
   - Check: Row exists with correct data
   - Check: Column names are snake_case

4. **Verify Logging:**
   - Command: `tail -f server/logs/anonymous/activity_*.log`
   - Check: All operations logged with timestamps
   - Check: Proper ISO 8601 format

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 in use | `netstat -ano \| findstr 5000` then kill process |
| DB connection failed | Check PostgreSQL running: `psql -U postgres` |
| Files not uploading | Check `server/uploads/` permissions: `chmod 755` |
| Logs not created | Check `server/logs/` exists and has permissions |
| Column name errors | Restart server to reload schema |

---

## 📁 Expected After Testing

```
server/
├── uploads/
│   ├── 1701453670123-file1.jpg
│   └── 1701453670456-file2.jpg
└── logs/
    └── anonymous/
        └── activity_2025-12-01.log
```

---

## ✨ Success Indicators

✅ All 5 tests pass
✅ Files appear in `uploads/`
✅ Rows appear in `inspections` table
✅ Logs created in `logs/{user}/`
✅ All operations logged with timestamps

---

For detailed verification procedures, see: [VERIFICATION_TESTING.md](./VERIFICATION_TESTING.md)

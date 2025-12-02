# ZURI Backend - Verification & Testing Guide

## 🎯 Verification Status

This document provides verification procedures and test commands to validate that all fixes and improvements are working correctly.

---

## ✅ Verification Checklist

### 1. Server Startup & Database Connection
- [ ] Server starts without errors
- [ ] PostgreSQL connection verified at startup
- [ ] Logs directory created
- [ ] Environment variables read correctly

**Test Command:**
```bash
cd Zuri/server
node server.js
```

**Expected Output:**
```
[DB] Using Postgres config: user=postgres host=localhost port=54321 database=zuri
[DB] Connected to Postgres, now= 2025-12-01T20:20:49.236Z
[LOG] Created logs directory: C:\Users\...\server\logs
🚀 Zuri backend running at http://localhost:5000
```

---

### 2. File Upload Functionality
- [ ] `/upload` endpoint accepts multipart/form-data
- [ ] Files saved to `server/uploads/` directory
- [ ] Unique filenames with timestamps
- [ ] Returns public URL in response
- [ ] Logged to per-user log file

**Test Command:**
```bash
# Create a test image or use any file
curl -X POST http://localhost:5000/upload \
  -F "photo=@path/to/test_image.jpg"
```

**Expected Response (201 Created):**
```json
{
  "url": "http://localhost:5000/uploads/1701453670123-abc123.jpg"
}
```

**Verify:**
- [ ] File appears in `server/uploads/` directory
- [ ] Log created: `server/logs/anonymous/activity_2025-12-01.log`
- [ ] Log contains: `[UPLOAD] Photo saved to uploads/...`

---

### 3. Inspection Data Submission
- [ ] `/inspections` endpoint accepts JSON data
- [ ] Database table created automatically if missing
- [ ] camelCase keys normalized to snake_case
- [ ] New columns added via ALTER TABLE
- [ ] Data persisted to PostgreSQL
- [ ] Logged to per-user log file

**Test Command:**
```bash
curl -X POST http://localhost:5000/inspections \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "527452745234",
    "depotId": "123",
    "companyId": "456",
    "tireCondition": "Good",
    "photoUrl": "http://localhost:5000/uploads/1701453670123-abc123.jpg",
    "timestamp": "2025-12-01T20:21:00.051Z"
  }'
```

**Expected Response (200 OK):**
```json
{
  "message": "Inspection saved"
}
```

**Verify:**
- [ ] Log contains: `[INSPECT] Inspection saved successfully`
- [ ] Database row created in `inspections` table
- [ ] Columns include: `vehicle_id`, `depot_id`, `company_id`, `tire_condition`, `photo_url`
- [ ] All data values match request

**Check Database:**
```bash
psql -h localhost -p 54321 -U postgres -d zuri \
  -c "SELECT * FROM inspections ORDER BY id DESC LIMIT 1;"
```

Expected columns (snake_case):
```
id | vehicle_id | depot_id | company_id | tire_condition | photo_url | timestamp
```

---

### 4. Request/Response Logging
- [ ] All requests logged (method, URL, IP, payload size)
- [ ] All responses logged (status code)
- [ ] Timestamps in ISO 8601 format
- [ ] Per-user log files created
- [ ] Daily rotation (new file each day)

**Test Command:**
```bash
# Check log file content
cat server/logs/anonymous/activity_$(date +%Y-%m-%d).log
```

**Expected Log Format:**
```
[2025-12-01T20:21:00.037Z] [REQ] POST /inspections from ::1 bodyKeys=5
[2025-12-01T20:21:00.050Z] [INSPECT] Saving inspection for vehicleId=527452745234
[2025-12-01T20:21:00.051Z] [INSPECT] Inspection saved successfully
[2025-12-01T20:21:00.051Z] [RES] POST /inspections status=200
```

---

### 5. Error Handling
- [ ] Invalid requests return proper error messages
- [ ] Errors logged with stack traces
- [ ] Centralized JSON error responses
- [ ] HTTP status codes correct

**Test Command:**
```bash
# Test with invalid/empty data
curl -X POST http://localhost:5000/inspections \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "No inspection data provided"
}
```

**Verify:**
- [ ] Error logged to file
- [ ] Response in JSON format
- [ ] Appropriate HTTP status code

---

### 6. Column Normalization (camelCase → snake_case)
- [ ] Incoming `vehicleId` stored as `vehicle_id`
- [ ] Incoming `depotId` stored as `depot_id`
- [ ] Incoming `photoUrl` stored as `photo_url`
- [ ] All camelCase normalized automatically

**Test Command:**
```bash
psql -h localhost -p 54321 -U postgres -d zuri \
  -c "\d inspections;"
```

**Expected Output:**
```
Column      | Type | Collation | Nullable | Default
vehicle_id  | text |           |          |
depot_id    | text |           |          |
photo_url   | text |           |          |
```

---

### 7. Dynamic Table & Column Creation
- [ ] Table created if missing on first submission
- [ ] New columns added via ALTER TABLE
- [ ] No errors when adding existing columns
- [ ] Schema evolves with data

**Test Command:**
```bash
# Submit data with new columns
curl -X POST http://localhost:5000/inspections \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "new123",
    "newCustomField": "customValue"
  }'
```

**Verify:**
- [ ] No database errors
- [ ] Response: 200 OK
- [ ] New column created: `new_custom_field`
- [ ] Log contains: `[INSPECT] Inspection saved successfully`

---

### 8. Session & Authentication
- [ ] Session created on login
- [ ] Username attached to logs
- [ ] Authenticated users logged separately
- [ ] Unauthenticated requests logged as 'anonymous'

**Test Command:**
```bash
# Check for authenticated user logs
ls server/logs/
```

**Expected:**
```
anonymous/
postgres/
```

**Verify:**
- [ ] Directory for each authenticated user exists
- [ ] Only 'anonymous' if no login attempted
- [ ] Each user has separate daily log files

---

## 📋 Manual Testing Procedure

### Phase 1: Setup & Startup
1. Ensure PostgreSQL is running on port 54321
2. Install dependencies: `npm install`
3. Start server: `node server.js`
4. Verify startup output shows DB connection success

### Phase 2: File Upload
1. Create test image: `convert -size 100x100 xc:blue test.jpg` (or use existing image)
2. Run upload test command above
3. Verify:
   - Response includes URL
   - File exists in `server/uploads/`
   - Log entry in `server/logs/anonymous/`

### Phase 3: Inspection Submission
1. Get uploaded file URL from Phase 2
2. Run inspection test command above
3. Verify:
   - Response: "Inspection saved"
   - Database row created
   - All columns present and normalized
   - Log entries recorded

### Phase 4: Error Handling
1. Submit with missing data
2. Submit with invalid JSON
3. Verify appropriate error responses and logging

### Phase 5: Full Integration
1. Upload file → Get URL
2. Submit inspection with URL
3. Check database
4. Review logs
5. Verify complete workflow

---

## 🔍 Troubleshooting

### Server won't start
**Check:**
- PostgreSQL running: `psql -U postgres -d zuri`
- Port 5000 available: `netstat -ano | findstr 5000`
- Dependencies installed: `npm list`

**Fix:**
```bash
# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
npm start
```

### Upload not working
**Check:**
- Logs: `cat server/logs/anonymous/activity_*.log | grep UPLOAD`
- Uploads directory exists: `ls -la server/uploads/`
- Permissions: `chmod 755 server/uploads/`

### Inspections not saving
**Check:**
- Database connection: `psql -h localhost -p 54321 -U postgres -d zuri`
- Table exists: `psql -c "\dt inspections"`
- Logs: `grep INSPECT server/logs/anonymous/activity_*.log`

### Logs not being created
**Check:**
- Logs directory exists: `ls -la server/logs/`
- Permissions: `chmod 755 server/logs/`
- User directories: `ls -la server/logs/`

---

## 📊 Quick Reference: Expected File Structure

After running tests, you should see:

```
server/
├── uploads/
│   ├── 1701453670123-abc123.jpg
│   ├── 1701453670456-def456.jpg
│   └── ...
│
├── logs/
│   ├── anonymous/
│   │   ├── activity_2025-12-01.log
│   │   └── activity_2025-12-02.log
│   ├── postgres/
│   │   └── activity_2025-12-01.log
│   └── [other_users]/
│
├── server.js
└── README.md
```

---

## ✅ Complete Verification Checklist

- [ ] Server starts with DB connection verified
- [ ] POST /upload accepts files and returns URLs
- [ ] Files persist in server/uploads/
- [ ] POST /inspections accepts JSON data
- [ ] Inspections save to PostgreSQL
- [ ] camelCase normalized to snake_case
- [ ] New columns created via ALTER TABLE
- [ ] All requests logged to per-user files
- [ ] All responses logged with status codes
- [ ] Error responses return JSON with status codes
- [ ] Errors logged with stack traces
- [ ] Daily log rotation working
- [ ] Log timestamps in ISO 8601 format
- [ ] Anonymous users logged separately from authenticated
- [ ] Integration test: Upload → Submit → Verify passes

---

## 🚀 Automated Testing (Optional)

Create a test script (`test.sh`):

```bash
#!/bin/bash

echo "=== ZURI BACKEND VERIFICATION TESTS ==="

# Test 1: Server startup
echo "Test 1: Starting server..."
node server.js &
SERVER_PID=$!
sleep 3

# Test 2: File upload
echo "Test 2: Testing file upload..."
curl -X POST http://localhost:5000/upload \
  -F "photo=@test.jpg"

# Test 3: Inspection submission
echo "Test 3: Testing inspection submission..."
curl -X POST http://localhost:5000/inspections \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"test123","tireCondition":"Good"}'

# Test 4: Check logs
echo "Test 4: Checking logs..."
ls -la server/logs/

# Cleanup
kill $SERVER_PID

echo "=== TESTS COMPLETE ==="
```

Run with: `bash test.sh`

---

## 📞 Test Summary

All verification items above confirm that the ZURI backend has:
- ✅ Robust file upload handling
- ✅ Reliable database persistence
- ✅ Comprehensive request/response logging
- ✅ Per-user audit trails
- ✅ Proper error handling
- ✅ Database schema evolution
- ✅ Full operational readiness

Once all items are checked, the system is production-ready for testing with the frontend.

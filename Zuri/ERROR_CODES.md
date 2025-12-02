# Zuri Error Code Reference

This document defines all error codes returned by the Zuri backend API. Each error code includes the HTTP status code, description, and recommended resolution.

---

## Authentication & Authorization

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `ERR_NOT_LOGGED_IN` | 401 | User is not authenticated | Log in with valid credentials |
| `ERR_LOGIN_INVALID_CREDENTIALS` | 401 | Username or password is incorrect | Verify credentials and try again |
| `ERR_LOGIN_FAILED` | 500 | Login process failed on the server | Check server logs, contact support |
| `ERR_ADMIN_ONLY` | 403 | Endpoint requires administrator role | Use an admin account or contact system administrator |

---

## File Upload (`/upload`)

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `ERR_UPLOAD_NO_FILE` | 400 | No file was attached or form field is named incorrectly | Ensure form field is named `photo` and a file is selected |
| `ERR_UPLOAD_SAVE_FAILED` | 500 | Server failed to save the uploaded file to disk | Check server disk space and permissions; contact support if persists |

---

## Inspections (`/inspections`)

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `ERR_INSPECT_EMPTY_PAYLOAD` | 400 | No inspection data was provided in request body | Include inspection data in request body |
| `ERR_INSPECT_SAVE_FAILED` | 500 | Failed to save inspection to database | Check server logs; ensure database is running |

---

## Scraps (`/api/scraps`)

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `ERR_SCRAP_INVALID_PAYLOAD` | 400 | Request body is invalid JSON or not an object | Send a valid JSON object in request body |
| `ERR_SCRAP_NO_DATA` | 400 | All fields in the scrap record are empty/null | Provide at least one valid field (e.g., `brand_number`, `size`, `brand`) |
| `ERR_SCRAP_FETCH_FAILED` | 500 | Failed to fetch scrap reports from database | Check server logs; ensure database is running |
| `ERR_SCRAP_SAVE_FAILED` | 500 | Failed to save scrap report to database | Check server logs; ensure database is running |
| `ERR_SCRAP_COLUMN_ISSUE` | 500 | Database column error (duplicate column, type mismatch, etc.) | Check server logs for specific SQL error |
| `ERR_SCRAP_NOT_FOUND` | 404 | Requested scrap record does not exist | Verify the scrap ID is correct |
| `ERR_SCRAP_COMPLETED` | 403 | Cannot modify a scrap report that is marked "Complete" | Only administrators can modify completed scraps; create a new scrap instead |
| `ERR_SCRAP_UNAUTHORIZED` | 403 | User does not have permission to modify this scrap | Only the owner, admin, or manager can modify this scrap |

---

## Table Operations (`/api/table/:key`)

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `ERR_TABLE_EMPTY_DATA` | 400 | No data provided or empty array sent | Provide at least one row of data |
| `ERR_TABLE_FETCH_FAILED` | 500 | Failed to fetch table data from database | Check server logs; ensure database is running |
| `ERR_TABLE_BULK_INSERT_FAILED` | 500 | Failed to insert bulk data into table | Check server logs; verify data format matches schema |
| `ERR_TABLE_DROP_FAILED` | 500 | Failed to drop table from database | Check server logs; ensure table exists and permissions allow deletion |
| `ERR_TABLE_CLEAR_FAILED` | 500 | Failed to clear (delete all rows from) table | Check server logs; ensure table exists and permissions allow deletion |

---

## Data Export (`/export/:key`)

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `ERR_EXPORT_FAILED` | 500 | Failed to export data to CSV or JSON | Check server logs; ensure table exists and contains valid data |

---

## Analytics (`/api/stats`)

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `ERR_STATS_FAILED` | 500 | Failed to compute analytics stats | Check server logs; ensure tyres and vehicles tables exist |

---

## Database Errors

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `ERR_DB_TABLE_CREATE_FAILED` | 500 | Failed to create table during migration | Check server logs; verify database permissions; restart server |
| `ERR_DB_TABLE_ALTER_FAILED` | 500 | Failed to add column to existing table | Check server logs; column may already exist or permission denied |

---

## Internal Server Errors

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| `ERR_INTERNAL_SERVER_ERROR` | 500 | Unexpected server error | Check server logs; contact support with error details |

---

## How to Use Error Codes

### In Browser Console
When using the app, check the browser console (F12) to see API responses. Look for the `code` field:
```json
{
  "error": "Failed to save scrap report",
  "code": "ERR_SCRAP_SAVE_FAILED",
  "details": "...details from development mode..."
}
```

### In Server Logs
Server logs are written per-user to: `server/logs/{username}/activity_YYYY-MM-DD.log`

Look for lines like:
```
[SCRAP] POST failed: <error message>
[RES] POST /api/scraps status=500
```

### In Network Tab
1. Open Developer Tools (F12)
2. Go to "Network" tab
3. Try the action that fails
4. Look at the failed request's "Response" tab for the error code

---

## Common Troubleshooting

### "ERR_NOT_LOGGED_IN"
- **Cause**: Session expired or user not authenticated
- **Fix**: Refresh page and log in again

### "ERR_SCRAP_SAVE_FAILED" or "ERR_SCRAP_COLUMN_ISSUE"
- **Cause**: Database connection issue or column mismatch
- **Fix**: 
  1. Restart the backend server: `node server/server.js`
  2. Check that database is running on port 54321
  3. Verify all required fields are populated in the form

### "ERR_UPLOAD_SAVE_FAILED"
- **Cause**: Disk space issue or permissions problem
- **Fix**:
  1. Check disk space: `Get-Volume` (PowerShell)
  2. Verify `server/uploads/` directory exists and is writable
  3. Restart backend server

### "ERR_TABLE_FETCH_FAILED"
- **Cause**: Database connection lost or table doesn't exist
- **Fix**:
  1. Restart backend server
  2. Verify database is running: `psql -h localhost -p 54321 -U postgres -d zuri -c "SELECT 1"`

---

## Development Mode vs Production

- **Development Mode**: Error responses include `details` field with full stack trace
- **Production Mode**: Stack traces are hidden for security

To enable development mode:
```powershell
$env:NODE_ENV = "development"
node server/server.js
```

---

## Reporting Issues

When reporting an issue, include:
1. The error code (e.g., `ERR_SCRAP_SAVE_FAILED`)
2. The HTTP status code (e.g., 500)
3. The full error message
4. Server logs from `server/logs/{your-username}/`
5. Browser console output from Network tab
6. Steps to reproduce


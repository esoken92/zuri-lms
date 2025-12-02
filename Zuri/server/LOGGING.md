# Per-User Persistent Logging System

## Overview
The server implements a per-user, persistent file-based logging system that records all HTTP requests, responses, and errors. Logs are organized by username and rotated daily.

## Log Structure

```
server/
├── logs/
│   ├── anonymous/           # Logs for unauthenticated requests
│   │   ├── activity_2025-12-01.log
│   │   ├── activity_2025-12-02.log
│   │   └── ...
│   ├── postgres/            # Logs for user "postgres"
│   │   ├── activity_2025-12-01.log
│   │   ├── activity_2025-12-02.log
│   │   └── ...
│   └── [other_usernames]/
│       └── activity_YYYY-MM-DD.log
```

## How It Works

### Logging Functions (server.js lines 54-84)

- **`getUserLogDir(username)`**: Maps username to sanitized directory path
  - Sanitizes username by replacing non-alphanumeric characters with underscores
  - Returns: `logs/{sanitized_username}/`

- **`ensureUserLogDir(username)`**: Creates directory if it doesn't exist
  - Creates nested directories as needed
  - Called automatically by `getUserLogFile()`

- **`getUserLogFile(username)`**: Returns path to today's log file
  - Generates filename: `activity_YYYY-MM-DD.log`
  - Format: `logs/{username}/activity_2025-12-01.log`

- **`logToFile(username, message)`**: Appends message to current day's log
  - Adds ISO timestamp to each line
  - Format: `[2025-12-01T14:30:45.123Z] message\n`
  - Gracefully handles write errors

### Request Lifecycle

1. **Middleware Attachment** (line 109)
   - Attaches `req.logUsername` = authenticated username OR "anonymous"
   - Executed on every request

2. **Request Logging** (lines 119-120)
   - Logs incoming request with method, URL, IP, and body key count
   - Format: `[REQ] GET /api/stats from ::1 bodyKeys=0`

3. **Response Logging** (lines 124-125)
   - Logs outgoing response with HTTP status code
   - Format: `[RES] GET /api/stats status=200`

4. **Route-Specific Logging**
   - `/upload`: Logs file upload attempts, success, and errors
   - `/inspections`: Logs inspection data received, table operations, and save status
   - Error handler: Logs all unhandled errors with stack traces

## Accessing Logs

### View a user's activity for today
```bash
cat logs/postgres/activity_2025-12-01.log
```

### View all user activity
```bash
ls -la logs/
```

### Search for specific user activity
```bash
grep "vehicleId=527" logs/postgres/activity_*.log
```

### Watch live logs for a user
```bash
tail -f logs/postgres/activity_2025-12-01.log
```

### Find all errors for a user
```bash
grep "\[ERROR\]" logs/postgres/activity_*.log
```

## Log Entry Examples

```
[2025-12-01T20:21:00.037Z] [REQ] POST /inspections from ::1 bodyKeys=0
[2025-12-01T20:21:00.050Z] [INSPECT] Saving inspection for vehicleId=527452745234
[2025-12-01T20:21:00.051Z] [INSPECT] Inspection saved successfully
[2025-12-01T20:21:00.051Z] [RES] POST /inspections status=200

[2025-12-01T20:21:05.123Z] [REQ] GET /api/stats from ::1 bodyKeys=0
[2025-12-01T20:21:05.456Z] [RES] GET /api/stats status=200

[2025-12-01T20:21:10.789Z] [REQ] POST /upload from ::1 bodyKeys=1
[2025-12-01T20:21:10.890Z] [UPLOAD] Photo saved to uploads/1701453670123-abc123.jpg
[2025-12-01T20:21:10.900Z] [RES] POST /upload status=200

[2025-12-01T20:21:15.123Z] [REQ] GET /nonexistent from ::1 bodyKeys=0
[2025-12-01T20:21:15.456Z] [ERROR] GET /nonexistent - Not Found
[2025-12-01T20:21:15.456Z] Error: Not Found at ...
[2025-12-01T20:21:15.456Z] [RES] GET /nonexistent status=404
```

## Features

✅ **Per-User Isolation**: Each user's logs are stored separately
✅ **Daily Rotation**: New log file created each day automatically
✅ **Timestamp Precision**: ISO 8601 format with millisecond precision
✅ **Automatic Directory Creation**: No manual setup required
✅ **Error Resilience**: Write failures logged to console, doesn't crash server
✅ **Authentication Aware**: Uses authenticated username or "anonymous" for unauthenticated requests
✅ **Comprehensive Coverage**: Logs requests, responses, errors, and route-specific events

## Troubleshooting

**Logs not being created:**
1. Check if `logs/` directory exists: `ls -la server/logs/`
2. Verify file permissions: `chmod 755 server/logs/`
3. Check server console for `[LOG] Failed to write user log` errors

**Wrong username in logs:**
- Verify session authentication is working: check `/login` endpoint
- Confirm `req.session.user.username` is being set correctly
- Unauthenticated requests default to "anonymous"

**Logs getting too large:**
- Daily rotation is automatic, but you can manually archive old logs:
  ```bash
  tar -czf logs_backup_2025-11.tar.gz logs/
  ```

## Security Notes

⚠️ **Sensitive Data**: Logs may contain request body data (passwords, personal info)
- Store in secure location with restricted permissions
- Consider redacting sensitive fields before sharing logs
- Implement log retention policy (e.g., delete logs older than 30 days)

## Future Enhancements

- [ ] Add log level filtering (DEBUG, INFO, WARN, ERROR)
- [ ] Implement log size limits with archival
- [ ] Add structured logging (JSON format for easier parsing)
- [ ] Create log viewer UI in admin dashboard
- [ ] Add log search and filter capabilities

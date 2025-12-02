# ZURI Backend Server

Express.js backend for the ZURI Tire Inspection & Logistics Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- PostgreSQL 12+ (running on port 54321 by default)
- Environment variables configured (see below)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the server directory:

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
PGHOST=localhost
PGPORT=54321
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=zuri

# Session
SESSION_SECRET=your_secret_key_here
```

If no `.env` file is provided, defaults are used:
- `PGHOST`: localhost
- `PGPORT`: 54321
- `PGUSER`: postgres
- `PGDATABASE`: zuri

### Start Server

```bash
npm start
```

Server runs at: `http://localhost:5000`

Output:
```
[DB] Using Postgres config: user=postgres host=localhost port=54321 database=zuri
[DB] Connected to Postgres, now= 2025-12-01T20:20:49.236Z
🚀 Zuri backend running at http://localhost:5000
```

---

## 📋 API Endpoints

### Authentication

#### POST /login
Log in a user.

**Request:**
```json
{
  "username": "postgres",
  "password": "your_password"
}
```

**Response (Success):**
```json
{
  "message": "Logged in",
  "user": {
    "id": 1,
    "username": "postgres",
    "role": "admin"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

#### POST /logout
Log out the current user.

**Response:**
```json
{
  "message": "Logged out"
}
```

### File Upload

#### POST /upload
Upload a photo file (multipart/form-data).

**Request:**
- Form field: `photo` (file)

**Response (Success - 201):**
```json
{
  "url": "http://localhost:5000/uploads/1701453670123-abc123.jpg"
}
```

**Response (Error):**
```json
{
  "error": "Failed to upload file",
  "details": "Error message"
}
```

### Inspections

#### POST /inspections
Submit tire inspection data and save to Postgres.

**Request:**
```json
{
  "vehicleId": "527452745234",
  "depotId": "123",
  "companyId": "456",
  "tireCondition": "Good",
  "photoUrl": "http://localhost:5000/uploads/1701453670123-abc123.jpg",
  "timestamp": "2025-12-01T20:21:00.051Z"
}
```

**Notes:**
- camelCase keys are automatically normalized to snake_case in the database
- `vehicleId` → stored as `vehicle_id`
- `depotId` → stored as `depot_id`
- Missing columns are created automatically via `ALTER TABLE`

**Response (Success - 200):**
```json
{
  "message": "Inspection saved"
}
```

**Response (Error):**
```json
{
  "error": "Failed to save inspection",
  "details": "Error message"
}
```

### Data Management

#### GET /api/table/:key
Retrieve all rows from a table.

**Example:** `GET /api/table/inspections`

**Response:**
```json
[
  {
    "id": 1,
    "vehicle_id": "527452745234",
    "depot_id": "123",
    ...
  }
]
```

**Requirements:** Authentication required (must be logged in)

#### GET /export/:key
Export table data as JSON or CSV.

**Query Parameters:**
- `type` - 'json' (default) or 'csv'

**Example:** `GET /export/inspections?type=csv`

**Response (CSV):**
```
id,vehicle_id,depot_id,...
1,527452745234,123,...
```

**Requirements:** Authentication required

#### POST /api/table/:key
Insert/update data in a table.

**Response:** Returns inserted/updated row data

**Requirements:** Authentication required

#### POST /api/clear/:key
Clear all data from a table (admin only).

**Response:**
```json
{
  "message": "Table cleared"
}
```

**Requirements:** Admin authentication required

#### GET /api/stats
Get analytics (inspections today, total vehicles).

**Response:**
```json
{
  "tyres_today": 5,
  "total_vehicles": 42
}
```

**Requirements:** Authentication required

---

## 📁 Project Structure

```
server/
├── server.js              # Main Express app, routes, middleware
├── package.json           # Dependencies
├── seed.js                # Database seed script
├── LOGGING.md             # Detailed logging documentation
├── LOGGING_MIGRATION_COMPLETE.md  # Migration report
│
├── db/                    # Database files
│   └── schema.sql         # PostgreSQL schema (if applicable)
│
├── routes/                # Route modules (optional structure)
│   ├── resetPassword.js
│   └── resetConfirm.js
│
├── uploads/               # User-uploaded files
│   ├── 1701453670123-abc123.jpg
│   ├── 1701453670456-def456.jpg
│   └── ...
│
├── logs/                  # Per-user activity logs (auto-created)
│   ├── postgres/
│   │   ├── activity_2025-12-01.log
│   │   └── activity_2025-12-02.log
│   ├── anonymous/
│   │   └── activity_2025-12-01.log
│   └── [username]/
│       └── activity_YYYY-MM-DD.log
│
└── node_modules/          # Dependencies
```

---

## 🔍 Logging System

ZURI implements a comprehensive per-user persistent logging system for audit trails and troubleshooting.

### Log Structure

All logs are organized by username with automatic daily rotation:

```
logs/{username}/activity_YYYY-MM-DD.log
```

**Examples:**
```
logs/postgres/activity_2025-12-01.log
logs/anonymous/activity_2025-12-01.log
logs/inspector_john/activity_2025-12-02.log
```

### What Gets Logged

✅ All HTTP requests (method, URL, IP, payload size)
✅ All HTTP responses (status code)
✅ File uploads (upload attempts, success, failures)
✅ Inspection data (save operations, DB errors)
✅ Unhandled errors (full stack traces)

### Log Entry Format

Each entry includes ISO 8601 timestamp with millisecond precision:

```
[2025-12-01T20:21:00.037Z] [REQ] POST /inspections from ::1 bodyKeys=5
[2025-12-01T20:21:00.050Z] [INSPECT] Saving inspection for vehicleId=527452745234
[2025-12-01T20:21:00.051Z] [INSPECT] Inspection saved successfully
[2025-12-01T20:21:00.051Z] [RES] POST /inspections status=200
```

### Accessing Logs

**View today's logs for a user:**
```bash
cat logs/postgres/activity_$(date +%Y-%m-%d).log
```

**View all user activity:**
```bash
ls -la logs/
```

**Search for specific events:**
```bash
grep "vehicleId=527" logs/postgres/activity_*.log
```

**Watch live logs:**
```bash
tail -f logs/postgres/activity_$(date +%Y-%m-%d).log
```

**Find all errors:**
```bash
grep "\[ERROR\]" logs/postgres/activity_*.log
```

For more detailed logging information, see [LOGGING.md](./LOGGING.md).

---

## 🔐 Authentication & Sessions

The server uses Express session middleware with the following features:

- **Session Store**: Memory-based (defaults to in-memory, consider `connect-pg-simple` for production)
- **Session Secret**: Configurable via `SESSION_SECRET` environment variable
- **User Roles**: `admin`, `manager`, `inspector`
- **Protected Routes**: Routes marked with `requireLogin` middleware require authentication

### Protected Routes

Routes requiring authentication:
- `GET /api/table/:key` - View table data
- `POST /api/table/:key` - Insert/update data
- `GET /export/:key` - Export data
- `GET /api/stats` - View analytics

Routes requiring admin role:
- `POST /api/clear/:key` - Clear table data

### Session Example

After successful login, the user object is stored in the session:

```javascript
req.session.user = {
  id: 1,
  username: "postgres",
  role: "admin"
}
```

---

## 🐘 PostgreSQL Integration

### Connection

The server connects to PostgreSQL using the `pg` library with configurable environment variables:

```javascript
const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 54321,
  database: process.env.PGDATABASE || 'zuri'
};
```

### Dynamic Table Creation

Tables are created automatically on first inspection submission:

```sql
CREATE TABLE IF NOT EXISTS "inspections" (id SERIAL PRIMARY KEY)
```

Missing columns are added dynamically via `ALTER TABLE`:

```sql
ALTER TABLE "inspections" ADD COLUMN "vehicle_id" TEXT
```

### Schema Notes

- Column names are normalized from camelCase to snake_case
- Example: `vehicleId` (JavaScript) → `vehicle_id` (PostgreSQL)
- All non-key columns default to TEXT type (can be customized)
- ID columns use SERIAL AUTO_INCREMENT

### Startup Check

On server start, connectivity is verified:

```bash
[DB] Using Postgres config: user=postgres host=localhost port=54321 database=zuri
[DB] Connected to Postgres, now= 2025-12-01T20:20:49.236Z
```

If the connection fails, the server exits with error code 1.

---

## 📤 File Uploads

### Upload Endpoint

Files are uploaded via `POST /upload` as multipart/form-data:

```bash
curl -X POST http://localhost:5000/upload \
  -F "photo=@/path/to/photo.jpg"
```

### Storage

- **Location**: `server/uploads/` directory
- **Naming**: Unique filenames with timestamp: `{timestamp}-{random}.{ext}`
- **Example**: `1701453670123-abc123.jpg`

### Response

**Success (201):**
```json
{
  "url": "http://localhost:5000/uploads/1701453670123-abc123.jpg"
}
```

This URL can then be sent with inspection data to the `/inspections` endpoint.

### Configuration

File upload is handled by `multer` with:
- Destination: `uploads/` directory
- File size limit: Configurable (default unlimited)
- Allowed types: Any file type accepted

---

## 🛠 Development & Testing

### Quick Test Commands

**Test Login:**
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"postgres","password":"your_password"}'
```

**Test Upload:**
```bash
curl -X POST http://localhost:5000/upload \
  -F "photo=@test_photo.jpg"
```

**Test Inspection Submission:**
```bash
curl -X POST http://localhost:5000/inspections \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "527452745234",
    "depotId": "123",
    "photoUrl": "http://localhost:5000/uploads/test.jpg"
  }'
```

**Seed Database:**
```bash
node seed.js
```

### Complete Verification

For comprehensive testing procedures including:
- Server startup verification
- File upload persistence
- Database persistence
- Request/response logging
- Error handling
- Integration testing

See: [VERIFICATION_TESTING.md](./VERIFICATION_TESTING.md)

---

## 📦 Dependencies

- **express** - Web framework
- **pg** - PostgreSQL client
- **express-session** - Session middleware
- **cors** - Cross-origin resource sharing
- **multer** - File upload middleware
- **bcrypt** - Password hashing
- **dotenv** - Environment variable loader
- **json2csv** - JSON to CSV conversion

---

## ⚙️ Middleware Stack

In order of execution:

1. **CORS** - Allow cross-origin requests from client
2. **JSON Parser** - Parse request bodies as JSON
3. **URL Encoded Parser** - Parse form data
4. **Session Middleware** - Session management and authentication
5. **Request Logger** - Log all incoming requests to console and file
6. **User Attachment** - Attach `req.logUsername` for logging
7. **Route Handlers** - Process requests
8. **Response Logger** - Log HTTP responses
9. **Error Handler** - Centralized error handling and logging

---

## 🔄 Recent Changes & Improvements

### v2.0 - Logging System Migration (December 2025)

**What Changed:**
- ✅ Converted from session-based logging to per-user persistent file logging
- ✅ All requests, responses, and errors now saved to `logs/{username}/` directories
- ✅ Daily log rotation (new file each day automatically)
- ✅ ISO 8601 timestamp precision for all entries
- ✅ Unauthenticated requests logged as 'anonymous'

**Benefits:**
- 📋 Complete audit trail by user
- 🔍 Easier troubleshooting with persistent logs
- 🛡️ Security and compliance logging
- 📊 User activity analytics

See [LOGGING_MIGRATION_COMPLETE.md](./LOGGING_MIGRATION_COMPLETE.md) for detailed migration report.

### v1.5 - File Upload & Inspection Fixes (November 2025)

**What Changed:**
- ✅ Fixed multipart/form-data upload (removed manual Content-Type header)
- ✅ Implemented `/upload` endpoint with multer
- ✅ Implemented `/inspections` endpoint with data validation
- ✅ Added camelCase to snake_case column normalization
- ✅ Implemented dynamic table creation and `ALTER TABLE` column addition
- ✅ Added request/response logging middleware
- ✅ Added centralized error handler
- ✅ Database connectivity check on startup

**Fixes:**
- 🐛 HTTP 500 errors on inspection submission now return proper error messages
- 🐛 FormData upload hanging issues resolved
- 🐛 Database column naming mismatches handled automatically
- 🐛 Improved error traceability with stack traces

---

## 🔮 Future Enhancements

- [ ] Session store to PostgreSQL (replace in-memory sessions)
- [ ] Log level filtering (DEBUG, INFO, WARN, ERROR)
- [ ] Log size limits with automatic archival
- [ ] Structured logging (JSON format for parsing)
- [ ] Admin dashboard log viewer
- [ ] Log search and filter UI
- [ ] Rate limiting and security headers
- [ ] API authentication (JWT tokens)
- [ ] WebSocket support for real-time updates
- [ ] GraphQL API alternative

---

## 📞 Support & Issues

For bugs, questions, or feature requests, contact:

**Kurt Jonathan**  
📧 esoken92@gmail.com

---

## 📄 License

ZURI_LMS is proprietary software. All rights reserved.

Unauthorized use or duplication will result in civil and/or criminal penalties under international copyright law.

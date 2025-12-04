# ZURI LMS Server

## Overview

The ZURI Logistics Management System (LMS) backend server provides RESTful APIs for tire inspection management, fleet tracking, and logistics operations.

## Architecture

This server has been refactored from a monolithic structure into a modular, maintainable architecture:

```
src/
├── app.js              # Main application entry point
├── config/
│   └── database.js     # Database configuration and connection pool
├── controllers/        # Route handlers (business logic)
├── middleware/         # Authentication, validation, error handling
├── models/            # Database models and queries
├── routes/            # API route definitions
├── services/          # Business logic services
└── utils/             # Utility functions and helpers
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
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
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=zuri_lms

# Session
SESSION_SECRET=your_secret_key_here
```

### Start Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
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

#### POST /api/auth/login
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
    "role": "Administrator"
  }
}
```

#### POST /api/auth/logout
Log out the current user.

**Response:**
```json
{
  "message": "Logged out"
}
```

### Inspections

#### POST /api/inspections
Create a new multi-vehicle inspection.

**Request:**
```json
{
  "header": {
    "companyId": "123",
    "depotId": "456",
    "date": "2025-12-04",
    "location": "Main Depot"
  },
  "vehicles": [
    {
      "vehiclePlate": "ABC123",
      "tires": [...]
    }
  ],
  "timestamp": "2025-12-04T10:00:00Z"
}
```

#### GET /api/inspections
List all inspections (filtered by user role).

#### GET /api/inspections/:id
Get a specific inspection by ID.

### Drafts

#### POST /api/drafts/inspection
Save an inspection draft.

#### GET /api/drafts/inspection/:draftId
Retrieve an inspection draft.

#### DELETE /api/drafts/inspection/:draftId
Delete an inspection draft.

### Scrap Management

#### GET /api/scraps
Get scrap reports for the authenticated user.

#### POST /api/scraps
Create or update a scrap report.

### Data Tables

#### GET /api/table/:key
Retrieve all rows from a table (authentication required).

#### POST /api/table/:key
Bulk upload data to a table (admin only).

#### DELETE /api/table/:key
Drop a table (admin only).

#### GET /api/table/export/:key
Export table data as JSON or CSV.

### File Upload

#### POST /upload
Upload a photo file (multipart/form-data).

**Request:**
- Form field: `photo` (file)

**Response (Success):**
```json
{
  "path": "/uploads/1701453670123-abc123.jpg"
}
```

---

## 📁 Project Structure

```
server/
├── src/                    # Main application source
│   ├── app.js              # Main Express application setup
│   ├── config/
│   │   └── database.js     # Database configuration
│   ├── controllers/        # Route handlers
│   │   ├── authController.js
│   │   ├── inspectionController.js
│   │   ├── scrapController.js
│   │   └── tableController.js
│   ├── middleware/         # Express middleware
│   │   ├── auth.js         # Authentication middleware
│   │   ├── errorHandler.js # Error handling
│   │   └── upload.js       # File upload middleware
│   ├── routes/             # API route definitions
│   │   ├── auth.js
│   │   ├── inspections.js
│   │   ├── scrap.js
│   │   └── table.js
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   │   ├── activityLogger.js
│   │   ├── clientInfo.js
│   │   └── databaseInit.js
│   └── models/             # Database models
├── tests/                  # Test files
│   └── setup.js
├── uploads/                # User-uploaded files
├── logs/                   # Per-user activity logs
├── package.json            # Dependencies and scripts
└── README.md               # This file
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

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Linting

```bash
# Check code style
npm run lint

# Auto-fix code style issues
npm run lint:fix
```

### Quick Test Commands

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"postgres","password":"your_password"}'
```

**Test Inspection Creation:**
```bash
curl -X POST http://localhost:5000/api/inspections \
  -H "Content-Type: application/json" \
  -H "Cookie: session_cookie_here" \
  -d '{
    "header": {"companyId": "123", "depotId": "456", "date": "2025-12-04", "location": "Main Depot"},
    "vehicles": [],
    "timestamp": "2025-12-04T10:00:00Z"
  }'
```

**Test File Upload:**
```bash
curl -X POST http://localhost:5000/upload \
  -H "Cookie: session_cookie_here" \
  -F "photo=@/path/to/photo.jpg"
```

---

## 📦 Dependencies

### Runtime Dependencies
- **express** - Web framework
- **pg** - PostgreSQL client
- **express-session** - Session management
- **cors** - Cross-origin resource sharing
- **multer** - File upload middleware
- **bcrypt** - Password hashing
- **json2csv** - JSON to CSV conversion
- **express-rate-limit** - Rate limiting
- **helmet** - Security headers
- **compression** - Response compression

### Development Dependencies
- **nodemon** - Auto-restart during development
- **jest** - Testing framework
- **supertest** - HTTP endpoint testing
- **eslint** - Code linting

## 🏗️ Architecture Benefits

The refactored modular architecture provides:

### ✅ Maintainability
- **Separation of Concerns**: Each module has a single responsibility
- **Easier Testing**: Isolated components can be tested independently
- **Code Reusability**: Utilities and middleware can be shared across modules

### ✅ Scalability
- **Modular Structure**: New features can be added without affecting existing code
- **Database Optimization**: Centralized connection pooling and query management
- **Middleware Stack**: Extensible authentication and validation layers

### ✅ Developer Experience
- **Clear Structure**: Easy to locate and modify specific functionality
- **Consistent Patterns**: Standardized controller, route, and middleware patterns
- **Documentation**: Self-documenting code structure

### ✅ Security & Performance
- **Centralized Security**: Authentication and authorization in one place
- **Error Handling**: Consistent error responses and logging
- **Resource Management**: Proper database connection pooling

## 🔄 Migration from Monolithic Structure

This server was refactored from a single 2,800+ line `server.js` file into the current modular structure. Key improvements:

- **Controllers**: Extracted business logic into dedicated controller files
- **Routes**: Separated API endpoint definitions from handlers
- **Middleware**: Isolated authentication, validation, and error handling
- **Configuration**: Centralized database and application settings
- **Utilities**: Reusable helper functions for logging, client info, and database operations

The refactoring maintains 100% API compatibility while dramatically improving code maintainability and testability.

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

# ZURI_LMS – Logistics Management System (Proprietary)

**ZURI_LMS** is a private, enterprise-grade Logistics Company Management System designed for transport fleets, tire management businesses, and logistics service providers. It integrates critical operations like inspections, stock control, reporting, and future modules for freight, scheduling, and analytics.

## 📂 Project Structure

```
Zuri/
├── client/              # React frontend
│   ├── src/             # Source files
│   ├── public/          # Static assets
│   └── package.json
│
├── server/              # Express.js backend
│   ├── server.js        # Main server
│   ├── logs/            # Per-user activity logs (auto-created)
│   ├── uploads/         # User-uploaded files
│   ├── package.json
│   └── README.md        # Server documentation
│
├── Dummy Data/          # Test data and components
└── README.md            # This file
```

---

## 🔧 Core Modules (Current & Planned)

- ✅ Tire Inspection & Condition Logging
- ✅ Stock Management (Tyres, Tools, Parts)
- ✅ Bluetooth LE Integration for Sensor Readings
- ✅ Photo Capture & Storage
- ✅ User Roles: Admin, Inspector, Manager
- 🔄 Offline Syncing & Cloud Backup
- 📋 Inspection Reporting & PDF Exports
- 📦 Dispatch Tracking & Vehicle Assignment (Coming Soon)
- 📊 Fleet Health Dashboards & Analytics (Planned)
- 🌐 Multi-Company & Multi-Depot Support (Planned)

---

## 📜 Recent Changes & Documentation

### v2.0 - Complete Backend Overhaul (December 2025)

**Per-User Persistent Logging System**
- ✅ Implemented per-user file-based logging (replaces session-based)
- ✅ Logs stored in `server/logs/{username}/activity_YYYY-MM-DD.log`
- ✅ All requests, responses, and errors automatically captured
- ✅ Unauthenticated requests logged as 'anonymous'
- 📖 See: [server/LOGGING.md](./Zuri/server/LOGGING.md) for detailed logging guide

**Backend Fixes & Improvements**
- ✅ Fixed FormData upload hanging (removed manual Content-Type header)
- ✅ Added `/upload` endpoint with multer file storage
- ✅ Added `/inspections` endpoint with PostgreSQL integration
- ✅ Implemented camelCase → snake_case column normalization
- ✅ Added dynamic table creation and ALTER TABLE logic
- ✅ Added request/response logging middleware
- ✅ Added centralized error handler
- ✅ Added PostgreSQL connectivity check at startup
- ✅ Environment variable support (.env configuration)

**Route Restructuring (Frontend)**
- ✅ Dashboard now default page at "/"
- ✅ Inspection Form moved to "/inspections"
- ✅ Reports at "/reports"
- ✅ Admin Dashboard at "/admin-dashboard"
- ✅ User Settings at "/settings"

**Documentation**
- 📖 [server/README.md](./Zuri/server/README.md) - Complete backend API and setup guide
- 📖 [server/LOGGING.md](./Zuri/server/LOGGING.md) - Detailed logging system documentation
- 📖 [LOGGING_MIGRATION_COMPLETE.md](./Zuri/LOGGING_MIGRATION_COMPLETE.md) - Migration completion report

### Migration Summary

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| Logging | Session-based (ephemeral) | Per-user persistent files | ✅ |
| Uploads | 500 errors, hanging | Working with multer | ✅ |
| DB Schema | Manual column management | Auto-created with ALTER TABLE | ✅ |
| Routes | Inspections at "/" | Dashboard at "/", Inspections at "/inspections" | ✅ |
| Error Handling | No centralized handler | Centralized JSON error responses | ✅ |
| Startup Check | No DB verification | PostgreSQL connectivity verified on boot | ✅ |

---

## 🚀 Quick Setup

### Backend
```bash
cd Zuri/server
npm install
npm start
```

Server runs at: `http://localhost:5000`

For detailed configuration and API documentation, see [server/README.md](./Zuri/server/README.md)

### Frontend
```bash
cd Zuri/client
npm install
npm start
```

Client runs at: `http://localhost:3000`

### Database
PostgreSQL must be running on `localhost:54321` (configurable via environment variables)

```bash
# Test connection
psql -h localhost -p 54321 -U postgres -d zuri
```

---

## 📖 Documentation Files

- **[server/README.md](./Zuri/server/README.md)** - Backend setup, API endpoints, configuration
- **[server/LOGGING.md](./Zuri/server/LOGGING.md)** - Logging system architecture and usage
- **[server/VERIFICATION_TESTING.md](./Zuri/server/VERIFICATION_TESTING.md)** - Comprehensive testing procedures
- **[server/TEST_QUICK_REFERENCE.md](./Zuri/server/TEST_QUICK_REFERENCE.md)** - Quick test commands
- **[LOGGING_MIGRATION_COMPLETE.md](./Zuri/LOGGING_MIGRATION_COMPLETE.md)** - Migration completion details
- **[CHANGES_DOCUMENTATION.md](./ZURI/CHANGES_DOCUMENTATION.md)** - Complete change log

---

## 🔧 Environment Configuration

Create `.env` files in both `server/` and `client/` directories:

**server/.env**
```env
PORT=5000
NODE_ENV=development
PGHOST=localhost
PGPORT=54321
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=zuri
SESSION_SECRET=your_secret_key_here
```

**client/.env**
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 🔐 Licensing

ZURI_LMS is **proprietary software**.  
All rights are reserved by the author. The source code and compiled applications may not be used, copied, distributed, or modified without explicit written permission.

> Unauthorized use or duplication will result in civil and/or criminal penalties under international copyright law.

---

## 📌 Future Plans

A **limited open-source community edition** may be released in the future under a permissive license (such as MIT or Apache 2.0). Subscribe or contact us to be notified.

---

## 📞 Contact

For demo access, licensing, or partnership opportunities:

**Kurt Jonathan**  
📧 [esoken92@gmail.com](mailto:esoken92@gmail.com)
📍 South Africa

---

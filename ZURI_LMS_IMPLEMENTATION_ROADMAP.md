# ZURI LMS: Development Auto-Login & Advanced User Management System

## Implementation Roadmap Document

*Created: December 4, 2025*
*Version: 1.0*

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Phase 1: Core Infrastructure Setup](#phase-1-core-infrastructure-setup)
3. [Phase 2: Hierarchical Permission System](#phase-2-hierarchical-permission-system)
4. [Phase 3: Enhanced Login System](#phase-3-enhanced-login-system)
5. [Phase 4: Advanced User Management Dashboard](#phase-4-advanced-user-management-dashboard)
6. [Phase 5: Data Seeding & Testing](#phase-5-data-seeding--testing)
7. [File Structure Changes](#file-structure-changes)
8. [Database Migration Strategy](#database-migration-strategy)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

This document outlines the complete implementation plan for adding development auto-login functionality and advanced user management to the ZURI LMS system. The implementation includes:

- **Developer Mode**: Server-controlled development features with passwordless login
- **Hierarchical User Roles**: 6-tier permission system (Administrator → Regional Manager → Group Manager → Store Manager → Supervisor → User)
- **Extended User Profiles**: Comprehensive user information including geographic data
- **Advanced User Management**: Full CRUD operations with role-based access control
- **Security-First Design**: Encrypted sensitive data with proper access controls

**Key Technical Decisions:**
- Extended users table approach (simplicity over normalization)
- Bcrypt hashing for security questions (consistent with passwords)
- Foreign key relationships for geographic hierarchy
- All countries included with SADC prioritization

---

## Phase 1: Core Infrastructure Setup

### 1.1 Developer Mode Configuration System
**Objective**: Create server-side developer mode detection and client communication

**Files to Create:**
- `server/src/config/developerMode.js`

**Implementation Steps:**
1. Create developer mode configuration module
2. Add environment variable `DEVELOPER_MODE=true/false`
3. Create middleware for developer mode validation
4. Add API endpoint `/api/developer-mode` for client communication

**Code Structure:**
```javascript
// server/src/config/developerMode.js
const isDeveloperMode = process.env.NODE_ENV !== 'production' &&
                       process.env.DEVELOPER_MODE === 'true';

module.exports = {
  isDeveloperMode,
  requireDeveloperMode: (req, res, next) => {
    if (!isDeveloperMode) {
      return res.status(403).json({ error: 'Developer mode not enabled' });
    }
    next();
  }
};
```

### 1.2 Enhanced Database Schema (Extended Users Table Approach)
**Decision**: Use extended users table for simplicity and performance

**New Tables to Create:**
- `countries` - All world countries with SADC prioritization
- `provinces` - Provinces/states linked to countries
- `regions` - Regional groupings (Global, Africa, etc.)
- `stores` - Store/branch locations

**Users Table Extensions:**
```sql
ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN country VARCHAR(100);
ALTER TABLE users ADD COLUMN province VARCHAR(100);
ALTER TABLE users ADD COLUMN region_id INTEGER REFERENCES regions(id);
ALTER TABLE users ADD COLUMN store_id INTEGER REFERENCES stores(id);
ALTER TABLE users ADD COLUMN branch VARCHAR(100);
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN dialling_code VARCHAR(10);
ALTER TABLE users ADD COLUMN phone_number VARCHAR(15);
ALTER TABLE users ADD COLUMN security_question_1 TEXT;
ALTER TABLE users ADD COLUMN security_answer_1_hash TEXT;
ALTER TABLE users ADD COLUMN security_question_2 TEXT;
ALTER TABLE users ADD COLUMN security_answer_2_hash TEXT;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
```

### 1.3 Geographic Data Seeding
**Countries Table**: All 195 countries with SADC priorities
**SADC Priority Order**: South Africa, Botswana, Namibia, Zimbabwe, Mozambique, Zambia, Malawi, Angola, Tanzania, Eswatini, Lesotho, Mauritius, Seychelles, Comoros, Madagascar, DRC

**Provinces Table**: Dynamic provinces based on country selection
- South Africa: 9 provinces
- Other countries: Major administrative divisions

### 1.4 Security Implementation for Sensitive Data
**Security Questions**: Use bcrypt hashing (same as passwords)
```javascript
// Hash security answers with bcrypt
const securityAnswer1Hash = await bcrypt.hash(security_answer_1, 12);
const securityAnswer2Hash = await bcrypt.hash(security_answer_2, 12);
```

**Password Policy**:
- Development: Passwordless auto-login
- Production: Required bcrypt hashed passwords

---

## Phase 2: Hierarchical Permission System

### 2.1 Role Definitions & Permissions Matrix

```
Administrator (zuri_admin):
  - CAN_DELETE_ANY_DATA: true
  - CAN_MANAGE_USERS: true (all users)
  - CAN_VIEW_ALL_ACTIVITIES: true
  - CAN_EDIT_ALL_ACTIVITIES: true
  - CAN_VIEW_ALL_REPORTS: true
  - FULL_SYSTEM_ACCESS: true

Regional Manager:
  - CAN_MANAGE_USERS: true (except Administrators)
  - CAN_VIEW_ACTIVITIES: true (except Administrators)
  - CAN_EDIT_ACTIVITIES: true (except Administrators)
  - CAN_VIEW_REPORTS: true (except Administrators)
  - REGION_SCOPE: assigned region

Group Manager:
  - CAN_MANAGE_USERS: true (Store Managers in their group)
  - CAN_VIEW_ACTIVITIES: true (Store Managers)
  - CAN_EDIT_ACTIVITIES: true (Store Managers)
  - GROUP_SCOPE: assigned group

Store Manager:
  - CAN_MANAGE_USERS: true (Supervisors/Users in their store)
  - CAN_VIEW_ACTIVITIES: true (Supervisors/Users)
  - CAN_EDIT_ACTIVITIES: true (Supervisors/Users)
  - STORE_SCOPE: assigned store

Supervisor:
  - CAN_VIEW_ACTIVITIES: true (Users in their store)
  - BASIC_USER_PERMISSIONS: true
  - STORE_SCOPE: assigned store

User:
  - CAN_CREATE_INSPECTIONS: true
  - CAN_CREATE_SCRAP_REPORTS: true
  - CAN_ADD_TO_DATABASES: true
  - CAN_DELETE_OWN_DATA: false
  - CAN_EDIT_OWN_DATA: true
```

### 2.2 Permission Middleware Architecture
**File**: `server/src/middleware/permissions.js`

**Functions**:
- `checkPermission(user, permission)` - Check specific permission
- `getUserScope(user)` - Get user's data access scope
- `filterDataByScope(data, user)` - Filter data based on user scope
- `canManageUser(manager, targetUser)` - Check if user can manage another user

---

## Phase 3: Enhanced Login System

### 3.1 Login Page Developer Mode Integration
**Client Changes** (`client/src/LoginPage.js`):
1. Add developer mode state: `const [developerMode, setDeveloperMode] = useState(false);`
2. Check developer mode on component mount:
   ```javascript
   useEffect(() => {
     fetch('/api/developer-mode')
       .then(res => res.json())
       .then(data => setDeveloperMode(data.developerMode));
   }, []);
   ```
3. Conditionally render developer login buttons

### 3.2 Auto-Login Button Implementation
**Buttons to Add**:
- 🔧 Administrator (zuri_admin)
- 🌍 Regional Manager (regional_mgr)
- 👥 Group Manager (group_mgr)
- 🏪 Store Manager (store_mgr)
- 👁️ Supervisor (supervisor)
- 👤 Normal User (normal_user)

**Backend Endpoint**: `POST /api/dev-login/:roleType`
- Only works in developer mode
- Auto-creates user if doesn't exist
- Sets proper session with role/profile data

### 3.3 User Auto-Creation Logic
For each role type, create user with:
- Predefined username based on role
- Complete profile data
- Proper role assignment
- Default geographic assignments

---

## Phase 4: Advanced User Management Dashboard

### 4.1 User Management API Endpoints
```
GET /api/admin/users - List users (with role-based filtering)
POST /api/admin/users - Create new user
PUT /api/admin/users/:id - Update user profile/role
DELETE /api/admin/users/:id - Delete user (admin only)
POST /api/admin/users/:id/reset-password - Reset password
GET /api/admin/users/:id/activity - Get user activity log
```

### 4.2 User Management UI Components
**Main Components**:
- `UserManagementPanel.js` - Main dashboard
- `UserList.js` - Searchable/filterable user list
- `UserForm.js` - Create/edit user form
- `UserProfile.js` - Detailed user profile view

**Form Fields**:
- Personal: First Name, Last Name
- Geographic: Country (dropdown), Province (dynamic), Region (dropdown), Branch
- Contact: Email (validation), Dialling Code + Phone
- Security: 2 security questions with hashed answers
- Role: Hierarchical role assignment

### 4.3 Geographic Dropdown Implementation
**Country Dropdown**: All countries, SADC first
**Province Dropdown**: AJAX load based on country selection
**Region Dropdown**: Predefined regions (Global, Africa, etc.)
**Store Dropdown**: User's accessible stores based on role

---

## Phase 5: Data Seeding & Testing

### 5.1 Development Data Seeding
**Test Users to Create**:
1. `zuri_admin` - Administrator with full profile
2. `regional_mgr` - Regional Manager
3. `group_mgr` - Group Manager
4. `store_mgr` - Store Manager
5. `supervisor` - Supervisor
6. `normal_user` - Basic User

**Geographic Data**:
- All 195 countries seeded
- Provinces for major countries
- Default regions: Global, Africa, SADC
- Default stores: Main Office

### 5.2 Security & Testing
**Security Tests**:
- Developer mode properly isolated
- Passwordless login only in development
- Role-based access control working
- Data filtering by user scope

**Permission Tests**:
- Each role can only access appropriate data
- Hierarchical management working
- Activity viewing restrictions enforced

---

## File Structure Changes

### New Files to Create:
```
server/src/config/
  ├── developerMode.js

server/src/middleware/
  ├── permissions.js

server/src/controllers/
  ├── userController.js

server/src/models/
  ├── User.js
  ├── Country.js
  ├── Province.js
  ├── Region.js
  ├── Store.js

client/src/components/admin/
  ├── UserManagementPanel.js
  ├── UserList.js
  ├── UserForm.js
  ├── UserProfile.js

client/src/data/
  ├── countries.js (seeded data)
  ├── provinces.js (seeded data)
```

### Files to Modify:
```
server/server.js - Add developer mode endpoints, user management APIs
server/src/utils/databaseInit.js - Add new tables and seeding
client/src/LoginPage.js - Add developer mode UI
client/src/App.js - Add user management routes
```

---

## Database Migration Strategy

1. **Backup existing data**
2. **Add new tables** (countries, provinces, regions, stores)
3. **Alter users table** with new columns
4. **Migrate existing user data** to new structure
5. **Seed geographic and test user data**
6. **Update foreign key constraints**

---

## Security Considerations

1. **Developer Mode Isolation**: Completely disabled in production
2. **Data Encryption**: Security answers hashed with bcrypt
3. **Input Validation**: All user inputs validated server-side
4. **Role-Based Access**: Every endpoint checks user permissions
5. **Audit Logging**: All user management actions logged

---

## Testing Strategy

1. **Unit Tests**: Permission middleware functions
2. **Integration Tests**: API endpoints with different user roles
3. **UI Tests**: Login page developer mode functionality
4. **Security Tests**: Attempt unauthorized access in production mode
5. **Performance Tests**: User management with large datasets

---

## Implementation Checklist

### Phase 1 ⏳
- [ ] Create developer mode configuration
- [ ] Update database schema with new tables
- [ ] Add geographic data seeding
- [ ] Implement security question hashing

### Phase 2 ⏳
- [ ] Create permission middleware
- [ ] Define role permissions matrix
- [ ] Implement hierarchical access control

### Phase 3 ⏳
- [ ] Update login page with developer mode
- [ ] Add auto-login buttons
- [ ] Implement auto-login backend logic

### Phase 4 ⏳
- [ ] Create user management API
- [ ] Build user management UI
- [ ] Implement geographic dropdowns

### Phase 5 ⏳
- [ ] Seed development data
- [ ] Test all role permissions
- [ ] Security testing and validation

---

## Approval Status
- [ ] **Phase 1 Approved** - Infrastructure Setup
- [ ] **Phase 2 Approved** - Permission System
- [ ] **Phase 3 Approved** - Login System
- [ ] **Phase 4 Approved** - User Management
- [ ] **Phase 5 Approved** - Testing & Deployment

**Approval Required Before Implementation Begins**
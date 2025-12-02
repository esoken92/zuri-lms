# Scrap Page Implementation Guide

## 📋 Overview

The Scrap Page is a new feature in the ZURI application that enables users to manage tire scrap reports within a controlled hierarchy of users. It provides a complete workflow for recording, tracking, and managing tire scrap information with role-based access control.

---

## 🏗️ Architecture

### Frontend Components

**File:** `client/src/pages/ScrapPage.js`
- React component with state management
- Form handling with validation
- Photo upload functionality
- Access control filtering

**Routes Integration:**
- Route: `/scrap`
- Added to Header navigation tabs
- Accessible to all authenticated users

### Backend Integration

**Existing Infrastructure:**
- Uses generic `/api/table/scraps` endpoint (already implemented)
- Automatic table creation on first submission
- camelCase to snake_case normalization
- Dynamic column addition via ALTER TABLE
- Per-user file logging

---

## 📋 Features

### 1. Scrap List Section
- Displays all accessible scrap reports
- Status indicators (In Progress / Complete)
- Quick navigation via clickable buttons
- Non-editable reports appear disabled
- Add New Scrap button

### 2. Scrap Report Form
**Editable Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Brand Number | Text | ✅ | Tire brand identifier |
| Size | Text | ✅ | Tire size specification |
| Brand | Text | ✅ | Tire manufacturer name |
| Pattern | Text | ❌ | Tread pattern type |
| DOT | Text | ❌ | Department of Transportation code |
| Caps | Number | ❌ | Number of caps |
| Retread Pattern | Text | ❌ | Retread design applied |
| Location of Damage | Text | ❌ | Where damage occurred |
| Reason for Damage | Textarea | ❌ | Why tire was scrapped |
| Photo | File | ❌ | Visual reference image |
| Status | Display | — | In Progress / Complete |

### 3. Photo Upload
- File input with image preview
- Uploads to `server/uploads/` directory
- Returns public URL stored in database
- Photo URL displays as preview before saving

### 4. Status Management
- **In Progress**: Form fields editable, "Mark Complete" button available
- **Complete**: Form locked (disabled), cannot edit or upload new photo

### 5. Workflow Actions
- **Save**: Saves form data and resets for new entry
- **Mark Complete**: Locks report and prevents further edits
- **Reset**: Clears form without saving
- **Continue**: Load existing In Progress report for editing

---

## 🔐 Access Control

### User Hierarchy

**Regular Users:**
- Can view only their own scrap reports
- `userId` filter automatically applied
- Cannot see other users' reports

**Store Managers:**
- Can view scrap reports from their store
- `storeId` filter applied
- Can see reports from users in their store

**Group Managers:**
- Can view all reports in their group
- No filter (full group visibility)

**Administrators:**
- Can view all scrap reports
- No restrictions

### Implementation
```javascript
const filterScrapReportsByAccess = (reports) => {
  if (user?.role === 'Administrator' || user?.role === 'Group Manager') {
    return reports; // Admins/Group Managers see all
  } else if (user?.role === 'Store Manager') {
    return reports.filter(r => r.storeId === user?.storeId);
  } else {
    return reports.filter(r => r.userId === user?.id); // Regular users
  }
};
```

---

## 💾 Data Storage

### Database Table: `scraps`

**Auto-created on first submission with columns:**
- `id` (SERIAL PRIMARY KEY)
- `brand_number` (TEXT)
- `size` (TEXT)
- `brand` (TEXT)
- `pattern` (TEXT)
- `dot` (TEXT)
- `caps` (TEXT)
- `retread_pattern` (TEXT)
- `location_of_damage` (TEXT)
- `reason_for_damage` (TEXT)
- `photo_url` (TEXT)
- `status` (TEXT: "In Progress" | "Complete")
- `user_id` (INTEGER)
- `user_name` (TEXT)
- `store_id` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Column Mapping:**
- camelCase (frontend) → snake_case (database)
- Example: `brandNumber` → `brand_number`

---

## 🔄 Data Flow

### Creating a New Scrap Report
1. User clicks "+ Add New Scrap"
2. Form initializes with empty fields
3. User fills in required fields (Brand Number, Size, Brand)
4. User optionally adds optional fields and photo
5. User clicks "Save"
6. Photo uploads to `server/uploads/` if provided
7. Report data POSTs to `/api/table/scraps`
8. Form resets, list refreshes
9. New report appears in Scrap List

### Editing an In Progress Report
1. User clicks a report in Scrap List
2. Form populates with report data
3. "Mark Complete" button visible
4. User can edit any field
5. User clicks "Save"
6. Updated data POSTs to `/api/table/scraps`
7. Form resets, list refreshes

### Completing a Report
1. User clicks "Mark Complete" button
2. Report status changes to "Complete"
3. Report POSTs to database with updated status
4. Report button becomes disabled in list
5. Form fields become disabled in edit view
6. "Mark Complete" button disappears
7. User must create new report for further entries

---

## 🧪 Testing the Scrap Page

### Prerequisites
- Backend server running (`npm start` in server directory)
- Frontend running (`npm start` in client directory)
- PostgreSQL database available
- User logged in with appropriate role

### Test Scenarios

**Scenario 1: Create New Scrap Report**
```
1. Navigate to /scrap
2. Click "+ Add New Scrap"
3. Fill in:
   - Brand Number: "TEST001"
   - Size: "225/75R16"
   - Brand: "Bridgestone"
4. Leave other fields empty (optional)
5. Click "Save"
6. Verify:
   - Form resets
   - New report appears in Scrap List
   - Report status shows "In Progress"
   - Database contains new record in 'scraps' table
```

**Scenario 2: Upload Photo**
```
1. Create new report or continue existing
2. Click file input under "Photo"
3. Select image file (JPG, PNG, etc.)
4. Verify:
   - Preview image displays
   - Photo uploads on Save
   - URL stored in database
```

**Scenario 3: Edit Report**
```
1. Click existing "In Progress" report
2. Update one or more fields
3. Click "Save"
4. Verify:
   - Form resets
   - Updated data shows in list
   - Database contains updated values
```

**Scenario 4: Complete Report**
```
1. Click "In Progress" report
2. Click "Mark Complete"
3. Verify:
   - Report status changes to "Complete"
   - Report button becomes disabled (grayed out)
   - Form fields become disabled
   - "Mark Complete" button disappears
   - "Save" button becomes disabled
```

**Scenario 5: Cannot Edit Complete Report**
```
1. Click "Complete" report in list
2. Verify:
   - Form fields are disabled
   - No edit possible
   - "Mark Complete" button not shown
   - Can reset form to go back
```

**Scenario 6: Access Control**
```
As Regular User:
1. Can only see own reports
2. Cannot see other users' reports

As Store Manager:
1. Can see all reports from own store
2. Cannot see reports from other stores

As Administrator:
1. Can see all reports
```

---

## 📱 API Endpoints Used

### GET /api/table/scraps
Fetches all scrap reports (filtered by access control on frontend)

**Response:**
```json
[
  {
    "id": 1,
    "brand_number": "TEST001",
    "size": "225/75R16",
    "brand": "Bridgestone",
    "pattern": "All-terrain",
    "dot": "2405",
    "caps": 2,
    "retread_pattern": "Radial",
    "location_of_damage": "Sidewall",
    "reason_for_damage": "Puncture damage",
    "photo_url": "http://localhost:5000/uploads/1701453670123-abc123.jpg",
    "status": "In Progress",
    "user_id": 1,
    "user_name": "john_inspector",
    "store_id": 1,
    "created_at": "2025-12-01T20:21:00.000Z",
    "updated_at": "2025-12-01T20:21:00.000Z"
  }
]
```

### POST /api/table/scraps
Creates new scrap report or updates existing one

**Request:**
```json
{
  "brand_number": "TEST001",
  "size": "225/75R16",
  "brand": "Bridgestone",
  "pattern": "All-terrain",
  "dot": "2405",
  "caps": "2",
  "retread_pattern": "Radial",
  "location_of_damage": "Sidewall",
  "reason_for_damage": "Puncture damage",
  "photo_url": "http://localhost:5000/uploads/1701453670123-abc123.jpg",
  "status": "In Progress",
  "user_id": 1,
  "user_name": "john_inspector",
  "store_id": 1,
  "created_at": "2025-12-01T20:21:00.000Z",
  "updated_at": "2025-12-01T20:21:00.000Z"
}
```

### POST /upload
Upload photo file for scrap report

**Request:** multipart/form-data
- Field: `photo` (file)

**Response:**
```json
{
  "url": "http://localhost:5000/uploads/1701453670123-abc123.jpg"
}
```

---

## 📊 Database Schema (Auto-created)

```sql
CREATE TABLE "scraps" (
  id SERIAL PRIMARY KEY,
  brand_number TEXT,
  size TEXT,
  brand TEXT,
  pattern TEXT,
  dot TEXT,
  caps TEXT,
  retread_pattern TEXT,
  location_of_damage TEXT,
  reason_for_damage TEXT,
  photo_url TEXT,
  status TEXT,
  user_id INTEGER,
  user_name TEXT,
  store_id INTEGER,
  created_at TEXT,
  updated_at TEXT
);
```

---

## 🎯 User Interface Flow

```
Login
  ↓
Dashboard
  ↓
Click "Scrap" in Header
  ↓
Scrap Page Loads
  ├─ Left Panel: Scrap List
  │  ├─ "+ Add New Scrap" button
  │  └─ List of report buttons
  │
  └─ Right Panel: Form Section
     ├─ Empty (if no report selected)
     └─ Form (if report selected)
        ├─ Brand Number
        ├─ Size
        ├─ Brand
        ├─ Pattern
        ├─ DOT
        ├─ Caps
        ├─ Retread Pattern
        ├─ Location of Damage
        ├─ Reason for Damage
        ├─ Photo Upload
        ├─ Status Display
        └─ Buttons: Save | Mark Complete | Reset
```

---

## 🔧 Troubleshooting

### Issue: Scrap Page Not Loading
**Solution:**
1. Verify backend `/api/table/scraps` endpoint exists
2. Check database connection
3. Verify user is logged in
4. Check browser console for errors

### Issue: Cannot Upload Photo
**Solution:**
1. Verify `/upload` endpoint is working
2. Check `server/uploads/` directory permissions
3. Ensure file size is within limits
4. Try with different image format

### Issue: Reports Not Showing in List
**Solution:**
1. Verify access control filters are correct
2. Check database for records in `scraps` table
3. Verify `user_id` matches logged-in user
4. Check browser console for API errors

### Issue: Form Fields Not Saving
**Solution:**
1. Verify all required fields are filled
2. Check backend console for errors
3. Verify POST endpoint response status (should be 200)
4. Check network tab in browser developer tools

### Issue: Cannot Complete Report
**Solution:**
1. Verify user is editing the report (not just viewing)
2. Check report status is "In Progress"
3. Verify backend connectivity
4. Try refreshing page and trying again

---

## 📈 Future Enhancements

As mentioned in the documentation:

1. **Search & Filter**
   - Filter by Brand, Size, Reason for Damage
   - Search by report details

2. **Export Functionality**
   - Export to PDF for auditing
   - Generate scrap reports for management

3. **Notifications**
   - Notify managers when reports completed
   - Email notifications for high-volume scraps

4. **Analytics**
   - Dashboard showing scrap trends
   - Reports by brand, reason, location
   - Time-based analysis

5. **Bulk Operations**
   - Bulk mark complete
   - Bulk export
   - Bulk delete (admin only)

---

## 📝 Code Structure

### Frontend (Client)
- **File:** `client/src/pages/ScrapPage.js` (490+ lines)
- **State Management:** React useState for form, reports, editing
- **API Calls:** axios for backend communication
- **Validation:** Required field checks before save
- **Access Control:** Filter logic in `filterScrapReportsByAccess()`

### Backend (Server)
- **Endpoint:** `/api/table/scraps` (generic, already exists)
- **Database:** Auto-creates `scraps` table on first submission
- **Column Mapping:** camelCase to snake_case
- **Logging:** All operations logged to per-user log files

### Navigation
- **Header:** Added "Scrap" tab in navigation
- **Routes:** Added `/scrap` route to App.js
- **Access:** Requires authentication

---

## ✅ Implementation Checklist

- [x] Create `ScrapPage.js` component
- [x] Add route `/scrap` to App.js
- [x] Add "Scrap" tab to Header navigation
- [x] Implement form with all required fields
- [x] Implement photo upload functionality
- [x] Implement access control filtering
- [x] Implement status management (In Progress / Complete)
- [x] Add form validation
- [x] Add error handling
- [x] Add loading states
- [x] Backend uses existing `/api/table/scraps` endpoint
- [x] Database auto-creates `scraps` table
- [x] Test scenarios documented

---

## 🎉 Status

**Implementation Status:** ✅ COMPLETE

The Scrap Page feature is fully implemented and ready for testing with the following components:
- Responsive UI with sidebar list and main form
- Complete CRUD operations
- Photo upload support
- Access control based on user role
- Status workflow management
- Backend integration with existing API

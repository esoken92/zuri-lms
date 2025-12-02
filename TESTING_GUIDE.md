# Quick Testing Guide - Multi-Vehicle Inspection Form

**Status**: Ready for Testing ✅  
**Server**: Running on http://localhost:5000  
**Client**: Running on http://localhost:3000

---

## 🚀 Quick Start

### 1. Access the Application
```
http://localhost:3000
```

### 2. Login with Test Account
- Use any credentials previously created
- Or check database for test users

### 3. Navigate to Inspections
- Click "Inspections" tab in main navigation
- Click "New Inspection" button

---

## 🧪 Core Features to Test

### ✅ Test 1: Header Section
**Expected**: Dropdowns for Company and Depot, Date and Location inputs
- [ ] Company dropdown loads companies
- [ ] Depot dropdown loads depots
- [ ] Date picker works
- [ ] Location text input works
- [ ] All fields are required (show red asterisk)

### ✅ Test 2: Manual Company Entry
**Expected**: Can add company not in database
- [ ] Click (✎) button next to Company dropdown
- [ ] Modal appears with fields: Name, Phone, Email
- [ ] Fill in company name (required)
- [ ] Click "Save"
- [ ] New company should appear in dropdown
- [ ] Modal closes
- [ ] New company auto-selected

### ✅ Test 3: Add Multiple Vehicles
**Expected**: Can add up to 5 vehicles
- [ ] "INSPECTION 1" card appears by default
- [ ] Vehicle count shows "1 / 5"
- [ ] "Add Inspection" button visible
- [ ] Click "Add Inspection" → "INSPECTION 2" appears
- [ ] Count shows "2 / 5"
- [ ] Repeat until 5 vehicles added
- [ ] "Add Inspection" button disabled when count = 5

### ✅ Test 4: Vehicle Configuration
**Expected**: Can select configuration for each vehicle
- [ ] For INSPECTION 1, enter Vehicle ID (e.g., "ABC123")
- [ ] Configuration dropdown shows available options
- [ ] Select a configuration (e.g., "Car - 4 Tires")
- [ ] TireGrid appears showing tire positions
- [ ] Configuration (✎) button visible
- [ ] Configuration (+) button visible

### ✅ Test 5: Tire Grid - Triple Depth
**Expected**: Can enter Inner, Middle, Outer depth readings
- [ ] TireGrid displays table with:
  - Position column (tire name)
  - Inner Depth column
  - Middle Depth column
  - Outer Depth column
  - Pressure column
  - Comments column
  - Photo icon
  - Expand arrow
- [ ] Click first tire row
- [ ] Enter Inner Depth: 7.5
- [ ] Enter Middle Depth: 7.2
- [ ] Enter Outer Depth: 6.8
- [ ] Enter Pressure: 2.8
- [ ] Enter Comments: "Good condition"
- [ ] Data persists

### ✅ Test 6: Tire Photo Upload
**Expected**: Can upload and view tire photos
- [ ] In TireGrid, click 📷 icon
- [ ] File browser opens
- [ ] Select a small image (< 10MB)
- [ ] Photo uploads successfully
- [ ] Expand arrow (▶) changes to (▼)
- [ ] Row expands showing photo preview

### ✅ Test 7: Comments Expansion
**Expected**: Full 300-char comments visible when expanded
- [ ] Click expand arrow (▶) on any tire
- [ ] Row expands showing:
  - Full Comments textarea (300 char limit)
  - Char counter (X/300)
  - Full-size photo upload
- [ ] Type long comment and confirm char limit
- [ ] Click ▼ to collapse

### ✅ Test 8: Add Trailers
**Expected**: Can add up to 2 trailers per vehicle
- [ ] At bottom of INSPECTION 1, see "Add Trailer" button
- [ ] Click "Add Trailer"
- [ ] "Trailer 1" section appears below Main Vehicle
- [ ] Enter Trailer ID: "TR001"
- [ ] Select Trailer Configuration
- [ ] TireGrid appears for trailer tires
- [ ] Click "Add Trailer" again
- [ ] "Trailer 2" appears
- [ ] Count shows "2 trailers"
- [ ] "Add Trailer" button disappears
- [ ] "Remove Trailer" button works on each trailer

### ✅ Test 9: Auto-Save
**Expected**: Form automatically saves to localStorage every 1.5s
- [ ] Status bar at top shows "Saving..."
- [ ] After 1.5s, changes to "Saved"
- [ ] Timestamp shows "Last saved: HH:MM:SS"
- [ ] Enter some data
- [ ] Open browser DevTools (F12)
- [ ] Go to Application → Local Storage
- [ ] Find key: `zuri-inspection-draft-v2`
- [ ] Value contains your entered data (JSON)
- [ ] Change data in form
- [ ] Wait 1.5s and refresh DevTools
- [ ] Verify updated data in localStorage

### ✅ Test 10: Browser Refresh Recovery
**Expected**: Data persists after browser refresh
- [ ] Fill in complete inspection data
- [ ] Auto-save completes (see "Saved" status)
- [ ] **Refresh browser** (Ctrl+R or F5)
- [ ] Expected: Form still shows all your data
- [ ] New draftId created for recovery
- [ ] **Result**: ✅ PASS if data restored, ❌ FAIL if lost

### ✅ Test 11: Form Validation
**Expected**: Submit disabled until form complete
- [ ] Start new inspection
- [ ] Try to click "Submit Inspection"
- [ ] **Expected**: Button disabled (greyed out)
- [ ] Fill in header fields only (no vehicles)
- [ ] Try to submit
- [ ] **Expected**: Error message "At least one vehicle is required"
- [ ] Fill in Vehicle 1 with ID and config
- [ ] Try to submit
- [ ] **Expected**: Error "At least one tire must be inspected"
- [ ] Add tire with incomplete depth readings
- [ ] Try to submit
- [ ] **Expected**: Error "At least one main tire must have all three depth readings"
- [ ] Complete one tire with all 3 depth readings
- [ ] Try to submit
- [ ] **Expected**: Success message appears

### ✅ Test 12: Submit Inspection
**Expected**: Inspection saves to database
- [ ] Complete full inspection with:
  - Header: Company, Depot, Date, Location
  - Vehicle 1: ID, Configuration, 1+ tire with triple depth
  - Optional: Trailer(s) with same structure
- [ ] Click "Submit Inspection"
- [ ] Expected: Toast message "Inspection submitted successfully!"
- [ ] Form clears
- [ ] New inspection saved to database

### ✅ Test 13: Manual Configuration Entry
**Expected**: Can suggest new vehicle configuration
- [ ] Click (+) button next to Configuration
- [ ] Modal appears with fields:
  - Configuration Code
  - Position Name (e.g., "Pos.1 - Steer")
  - Number of Tires
- [ ] Fill in:
  - Code: "CUSTOM_TEST"
  - Position Name: "Test Configuration"
  - Tires: 6
- [ ] Click "Save"
- [ ] Toast: "Configuration added and pending admin review"
- [ ] Modal closes

### ✅ Test 14: Expand/Collapse Vehicles
**Expected**: Can collapse vehicle cards to save space
- [ ] With 2+ vehicles added
- [ ] Click ▼ button on INSPECTION 1 header
- [ ] Expected: Card collapses, shows only title
- [ ] Click ▶ on collapsed card
- [ ] Expected: Card expands again

### ✅ Test 15: Delete Vehicle
**Expected**: Can remove added vehicles (not first)
- [ ] Add 3 vehicles (INSPECTION 1, 2, 3)
- [ ] Try to delete INSPECTION 1
- [ ] Expected: "Delete Inspection" button is disabled (no warning shown)
- [ ] Click "Delete Inspection" on INSPECTION 2
- [ ] Expected: INSPECTION 2 removed, count shows "2 / 5"
- [ ] INSPECTION 3 becomes INSPECTION 2
- [ ] Verify it worked

---

## 📊 Data Entry Example

### Sample Complete Inspection

**Header**:
- Company: "ABC Transport"
- Depot: "Main Warehouse"
- Date: "2025-12-03"
- Location: "Building A, Bay 1"

**Vehicle 1**:
- Vehicle ID: "TRUCK-001"
- Configuration: "Truck 3-Axle"
- Tire Data:
  | Position | Inner | Middle | Outer | Pressure | Comments |
  |----------|-------|--------|-------|----------|----------|
  | Pos.1    | 7.5   | 7.2    | 6.8   | 2.8      | Good     |
  | Pos.2    | 7.3   | 7.0    | 6.9   | 2.8      | Good     |
  | Pos.3    | 7.4   | 7.1    | 6.7   | 2.8      | Slight wear |

**Trailer 1**:
- Trailer ID: "TR-001"
- Configuration: "Trailer 2-Axle"
- Tire Data: (similar to vehicle)

---

## 🎯 Pass/Fail Criteria

### ✅ PASS
- All 15 tests pass
- Form validates correctly
- Data persists in localStorage
- Auto-save works every 1.5s
- Inspection submits successfully
- Multiple vehicles can be added
- Photos upload correctly
- Triple depth readings are entered

### ❌ FAIL
- Build errors or console errors
- Form doesn't load
- Components not visible
- Auto-save doesn't work
- Data lost on refresh
- Submit fails with no error message
- Photos don't upload
- Validation allows incomplete data

---

## 🐛 Known Limitations

1. **Browser Refresh Recovery**: Uses localStorage only (not server draft yet)
   - Server endpoints created but frontend not using API drafts
   - Can be enhanced to use server storage

2. **Configuration Suggestions**: Submitted but approval workflow not in UI
   - Admin endpoint exists but no admin UI to approve
   - Can view in database

3. **Offline Sync**: Old inspection form uses localStorage for pending
   - New multi-vehicle form needs offline sync implementation
   - Server can accept offline data if provided

---

## 📝 Testing Notes

- Use browser DevTools (F12) to check console for errors
- Check Network tab for failed API calls
- Check localStorage for draft persistence
- Check database if submission doesn't appear in list

---

**Happy Testing!** 🚀

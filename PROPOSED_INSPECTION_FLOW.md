# PROPOSED INSPECTION FORM RESTRUCTURE

## CURRENT STATE
```
InspectionForm (single inspection with single vehicle)
├─ Vehicle ID, Customer Name, Location, Depot
├─ Vehicle Configuration (Car, Truck, Tractor + 2 optional trailers)
├─ Tire Grid (edit tires for that vehicle)
└─ Submit
```

## PROPOSED NEW STATE

### FORM STRUCTURE - TWO-LEVEL HIERARCHY

```
┌─ INSPECTION HEADER (Top Level) ─────────────────┐
│                                                  │
│  Company *          [Dropdown from DB]           │
│  Depot *            [Dropdown from DB]           │
│  Date *             [Date Picker]                │
│  Location *         [Text Input]                 │
│                                                  │
│  [+ ADD VEHICLE] Button                          │
│                                                  │
└──────────────────────────────────────────────────┘
     │
     ├─ INSPECTION 1 (Vehicle Group)
     │  ├─ [Expand/Collapse]
     │  ├─ Main Vehicle
     │  │  ├─ Vehicle ID * (e.g., MTS001)
     │  │  ├─ Configuration (e.g., S2.D4.D4)
     │  │  └─ [View/Edit Tires] Button
     │  │
     │  ├─ Trailer 1 (Optional)
     │  │  ├─ Vehicle ID * (e.g., MTS001-T1)
     │  │  ├─ Configuration (e.g., T4.T4)
     │  │  └─ [View/Edit Tires] Button
     │  │
     │  ├─ Trailer 2 (Optional)
     │  │  ├─ Vehicle ID * (e.g., MTS001-T2)
     │  │  ├─ Configuration (e.g., T4.T4)
     │  │  └─ [View/Edit Tires] Button
     │  │
     │  └─ [Delete Vehicle] Button
     │
     ├─ INSPECTION 2 (Vehicle Group)
     │  ├─ [Expand/Collapse]
     │  ├─ Main Vehicle
     │  │  ├─ Vehicle ID *
     │  │  ├─ Configuration
     │  │  └─ [View/Edit Tires] Button
     │  └─ ... (optional trailers)
     │
     └─ INSPECTION 3 (Vehicle Group)
        ├─ [Expand/Collapse]
        ├─ Main Vehicle
        │  ├─ Vehicle ID *
        │  ├─ Configuration
        │  └─ [View/Edit Tires] Button
        └─ ... (optional trailers)
```

---

## USER WORKFLOW

### Step 1: Fill Inspection Header
```
User enters:
- Company: "ABC Transport" ✓
- Depot: "Main Depot" ✓
- Date: "2025-12-03" ✓
- Location: "Warehouse A" ✓

→ Header data AUTO-SAVED to server (draft status)

[+ ADD VEHICLE] Button becomes active
```

### Step 2: Add First Vehicle
```
User clicks [+ ADD VEHICLE]
→ New card appears: "INSPECTION 1"
→ Shows Main Vehicle section:
   - Vehicle ID input (e.g., MTS001)
   - Configuration dropdown (loaded from DB)
   - Configuration suggestion button: Add custom configuration similar to company suggestions
     (If user's configuration not found, they can create it inline)
   - Once filled → Tire grid appears for that vehicle
   - Inspection can be done on Inner, Middle, and Outer tire sections
   - Pressures are also entered

→ Vehicle data AUTO-SAVED to server (draft status)
```

### Step 3: Fill Vehicle Details and Inspect Tires for Main Vehicle
```
User enters:
├─ Vehicle ID: "MTS001" *required
│  → AUTO-SAVED to server
│
├─ Configuration: "S2.D4.D4" (dropdown)
│  → AUTO-SAVED to server
│  → Tire grid LOADS with tire positions based on config
│
└─ Tire Grid APPEARS ON SAME PAGE
   (No modal - breadcrumb shows: Inspection 1 > Main Vehicle > Tires)
   ├─ FL (Front Left) - Pos.1 - Steer (position name from vehicle configuration database)
   │  ├─ Tread Depth (Inner): [___]
   │  ├─ Tread Depth (Middle): [___]
   │  ├─ Tread Depth (Outer): [___]
   │  ├─ Pressure: [___]
   │  ├─ Comments: [Text box - 300 char max]
   │  ├─ Photo: [Upload]
   │  → AUTO-SAVED to server as user types
   │
   ├─ FR (Front Right) - Pos.2 - Steer
   │  └─ (same as above with 3 depth readings)
   │
   ├─ RR/RL/etc (all positions with their names and types from DB)
   │  └─ (same as above with 3 depth readings)
   │
   └─ [+ Add Spare Wheels] (optional)
      When added, spare wheels have the same inspection structure
      Multiple spares can be added, each in different conditions
```

### Step 4: Add Trailers (Optional)
```
User clicks [+ Add Trailer 1]
→ Trailer 1 section appears with:
   - Vehicle ID input (e.g., MTS001-T1)
   - Configuration dropdown
   - Tire grid for trailer
   → AUTO-SAVED to server

User can click [+ Add Trailer 2] if needed
→ Same structure as Trailer 1
   → AUTO-SAVED to server
```

### Step 5: Add More Vehicles (Up to 5 Total)
```
User clicks [+ ADD VEHICLE] again
→ "INSPECTION 2" card appears
→ User repeats Step 3-4 for new vehicle
→ All data AUTO-SAVED to server

Can add up to 5 vehicles per inspection
```

### Step 6: Real-time Breadcrumb Navigation
```
Example breadcrumb trail as user navigates:
- Inspections > Main > Inspection 1 > Main Vehicle > Tires
- Inspections > Main > Inspection 1 > Trailer 1 > Tires
- Inspections > Main > Inspection 2 > Main Vehicle > Tires

User always knows their depth in the form
```

### Step 7: Device Failure Protection
```
If user switches devices:
1. Open same inspection
2. All previously entered data is retrieved from server
3. User can continue where they left off
4. No data loss

If user closes browser:
1. Data remains on server as draft
2. User can resume inspection later
3. Draft status shown in inspection list
```

### Step 8: Submit Final Inspection
```
User ensures all required fields filled:
✓ Company
✓ Depot
✓ Date
✓ Location
✓ At least 1 vehicle with:
  ✓ Vehicle ID
  ✓ Configuration
  ✓ At least 1 tire added to main vehicle and inspected

User clicks [✓ SUBMIT INSPECTION]
→ Changes draft status from "draft" to "submitted"
→ Success message
→ Form resets for new inspection
```

---

## DATA STRUCTURE (State + Server Storage)

### Local State (React):
```javascript
{
  // Header (Inspection level)
  header: {
    companyId: "123",
    depotId: "456",
    date: "2025-12-03",
    location: "Warehouse A",
  },
  
  // Vehicles (Max 5)
  vehicles: [
    {
      inspectionIndex: 1,
      mainVehicle: {
        id: "MTS001",
        vehicleType: "S2.D4.D4",
        tires: [
          { 
            position: "FL",
            positionName: "Pos.1 - Steer",
            depthInner: 7,
            depthMiddle: 7.2,
            depthOuter: 6.8,
            pressure: 32,
            comments: "",
            photo: null 
          },
          { 
            position: "FR",
            positionName: "Pos.2 - Steer",
            depthInner: 8,
            depthMiddle: 8.1,
            depthOuter: 7.9,
            pressure: 32,
            comments: "",
            photo: null 
          },
          ...
        ],
        spares: [
          // Optional spare tires with same structure as regular tires
          {
            spareNumber: 1,
            positionName: "Spare 1",
            depthInner: 5,
            depthMiddle: 5.1,
            depthOuter: 4.9,
            pressure: 28,
            comments: "Good condition",
            photo: null
          }
        ]
      },
      trailer1: {
        id: "MTS001-T1",
        vehicleType: "T4.T4",
        tires: [...]
      },
      trailer2: null, // optional, null if not added
    },
    {
      inspectionIndex: 2,
      mainVehicle: {...},
      trailer1: null,
      trailer2: null,
    },
  ],
  
  // Draft metadata
  draftId: "draft_2025_12_03_001",
  lastSavedTimestamp: "2025-12-03T10:30:00Z",
  status: "draft", // or "submitted"
}
```

### Server Storage (Draft):
```javascript
// Stored in database with draftId as key
{
  draftId: "draft_2025_12_03_001",
  userId: "user123",
  createdAt: "2025-12-03T09:00:00Z",
  lastModifiedAt: "2025-12-03T10:30:00Z",
  status: "draft",
  data: {
    // Full inspection data structure above
  }
}
```

### Auto-Save Strategy:
```
1. User fills any field
   → After 1-2 seconds debounce
   → POST/PUT to /api/drafts/:draftId
   → Server stores entire inspection state

2. User changes device
   → New device opens same inspection ID
   → GET /api/drafts/:draftId
   → All previously entered data loads
   → User continues from last save point

3. User navigates away
   → Data remains on server as draft
   → Can resume later from any device
   → No local storage needed (but can use as fallback)

4. User clicks Submit
   → POST to /api/inspections (move from draft to final)
   → Mark draft as submitted/archived
   → Clear local state
```

---

## UI COMPONENTS TO CREATE/MODIFY

### New Components:
1. **InspectionHeader.js**
   - Company, Depot, Date, Location inputs
   - [+ ADD VEHICLE] button

2. **VehicleCard.js** (Repeatable for each inspection)
   - Expandable container
   - Shows "Inspection 1", "Inspection 2", etc.
   - Contains: MainVehicleSection + TrailerSections

3. **MainVehicleSection.js**
   - Vehicle ID input
   - Configuration dropdown
   - [View/Edit Tires] button

4. **TrailerSection.js** (Repeatable)
   - Vehicle ID input (Trailer 1/2)
   - Configuration dropdown
   - [View/Edit Tires] button
   - [Remove Trailer] button

5. **TireModalEditor.js**
   - Modal popup for editing tires
   - Full tire grid with entry fields
   - Save/Cancel buttons

### Modified Components:
1. **InspectionForm.js** (Main)
   - Remove single vehicle logic
   - Implement multi-vehicle array management
   - Add vehicle/trailer add/remove functions
   - Update validation logic
   - Update submission payload

---

## VALIDATION CHANGES

### Before Submission, Validate:
```
✓ Company selected
✓ Depot selected
✓ Date entered
✓ Location entered
✓ At least 1 vehicle added

For EACH Vehicle:
  ✓ Main Vehicle ID filled
  ✓ Main Vehicle Configuration selected
  ✓ At least 1 tire added to main vehicle
  
  If Trailer 1 exists:
    ✓ Trailer 1 ID filled
    ✓ Trailer 1 Configuration selected
    ✓ At least 1 tire added to trailer 1
  
  If Trailer 2 exists:
    ✓ Trailer 2 ID filled
    ✓ Trailer 2 Configuration selected
    ✓ At least 1 tire added to trailer 2
```

---

## SUBMISSION PAYLOAD

```json
{
  "company": {
    "id": "123",
    "name": "ABC Transport"
  },
  "depot": {
    "id": "456",
    "location": "Main Depot"
  },
  "date": "2025-12-03",
  "location": "Warehouse A",
  "inspections": [
    {
      "inspectionNumber": 1,
      "mainVehicle": {
        "vehicleId": "MTS001",
        "configuration": "S2.D4.D4",
        "tires": [
          { 
            "position": "FL",
            "positionName": "Pos.1 - Steer",
            "depthInner": 7,
            "depthMiddle": 7.2,
            "depthOuter": 6.8,
            "pressure": 32,
            "comments": "Good condition",
            "photo": "photo_url_or_base64"
          },
          ...
        ],
        "spares": [
          {
            "spareNumber": 1,
            "positionName": "Spare 1",
            "depthInner": 5,
            "depthMiddle": 5.1,
            "depthOuter": 4.9,
            "pressure": 28,
            "comments": "Available for use",
            "photo": "photo_url_or_base64"
          }
        ]
      },
      "trailers": [
        {
          "vehicleId": "MTS001-T1",
          "configuration": "T4.T4",
          "tires": [...]
        }
      ]
    },
    {
      "inspectionNumber": 2,
      "mainVehicle": { ... },
      "trailers": [ ... ]
    }
  ],
  "timestamp": "2025-12-03T10:30:00Z"
}
```

---

## IMPLEMENTATION STEPS

1. **Create new component structure** (VehicleCard, Sections, Modal)
2. **Refactor InspectionForm state** (header + vehicles array)
3. **Update handleSubmit** (collect all vehicles + all tires)
4. **Update validation logic** (per-vehicle validation)
5. **Implement tire modal** (edit tires per vehicle)
6. **Update dropdown loading** (companies, depots, configurations)
7. **Test flow** (add vehicles, add trailers, edit tires, submit)
8. **Update API endpoint** (server expects new payload structure)

---

## BENEFITS

✅ **One inspection = Multiple vehicles** (real-world scenarios)
✅ **Main + Trailers** (truck + trailer support)
✅ **Organized UI** (expandable sections, not overwhelming)
✅ **Modular tires** (each vehicle gets its own tire inspection)
✅ **Flexible** (add vehicles on-the-fly)
✅ **Cleaner data** (structured hierarchy in DB)
✅ **Better tracking** (know which tires belong to which vehicle)

---

## MOCKUP - SINGLE SCREEN LAYOUT WITH BREADCRUMBS

### Layout Option 1: Inspection Header + Vehicle with Inline Tires
```
═══════════════════════════════════════════════════════════════════════
                         INSPECTION FORM
═══════════════════════════════════════════════════════════════════════

BREADCRUMB: Inspections > Main

┌─────────────────────────────────────────────────────────────────────┐
│ INSPECTION HEADER                                                   │
│                                                                     │
│ Company *              [▼ ABC Transport]                            │
│ Depot *                [▼ Main Depot]                               │
│ Date *                 [2025-12-03]                                 │
│ Location *             [Warehouse A_________]                       │
│                                                                     │
│                       [+ ADD VEHICLE]                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

BREADCRUMB: Inspections > Main > Inspection 1 > Main Vehicle

┌─ INSPECTION 1  [▼]                    [× DELETE] ─────────────────┐
│                                                                    │
│ 🚗 MAIN VEHICLE                                                    │
│ ├─ Vehicle ID *        [MTS001____________]                        │
│ ├─ Configuration       [▼ S2.D4.D4]  [✎] [+]                       │
│ │                      (6 Tires selected)                          │
│ │                      ✎ = Manually edit config                   │
│ │                      + = Suggest new config if not found         │
│ │                                                                  │
│ │  ┌─ TIRE INSPECTION ──────────────────────────────────────────┐  │
│ │  │                                                            │  │
│ │  │ Position  │ Depth  │ Pressure │ Condition │ Damage │ Photo │  │
│ │  ├───────────┼────────┼──────────┼───────────┼────────┼───────┤  │
│ │  │ FL        │ [_7__] │ [_32__]  │ [▼ good]  │ [☐☐☐] │ [📷] │  │
│ │  │ FR        │ [_8__] │ [_32__]  │ [▼ good]  │ [☐☐☐] │ [📷] │  │
│ │  │ RL        │ [_6__] │ [_30__]  │ [▼ fair]  │ [☑☐☐] │ [📷] │  │
│ │  │ RR        │ [____] │ [____]   │ [▼ ----]  │ [☐☐☐] │ [📷] │  │
│ │  │ Spare 1   │ [____] │ [____]   │ [▼ ----]  │ [☐☐☐] │ [📷] │  │
│ │  │ Spare 2   │ [____] │ [____]   │ [▼ ----]  │ [☐☐☐] │ [📷] │  │
│ │  │                                                            │  │
│ │  │ [+ Add More Spares]                                        │  │
│ │  │                                                            │  │
│ │  └────────────────────────────────────────────────────────────┘  │
│ │                                                                  │
│ └─ [+ Add Trailer 1]                                               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

BREADCRUMB: Inspections > Main > Inspection 1 > Trailer 1

┌─ INSPECTION 1 - TRAILER 1  [▼]        [× DELETE] ──────────────────┐
│                                                                     │
│ 🚙 TRAILER 1                                                        │
│ ├─ Vehicle ID *        [MTS001-T1__________]                        │
│ ├─ Configuration       [▼ T4.T4]                                    │
│ │                      (4 Tires selected)                          │
│ │                                                                  │
│ │  ┌─ TIRE INSPECTION ──────────────────────────────────────────┐  │
│ │  │                                                            │  │
│ │  │ Position │ Inner │ Middle │ Outer │ Pressure │ Comments   │  │
│ │  ├──────────┼───────┼────────┼───────┼──────────┼────────────┤  │
│ │  │ Pos.1    │ [_6__]│ [_6.1_]│[_5.9_]│ [_28__] │[Comments] │  │
│ │  │ Trailer  │       │        │       │         │[📷 Photo] │  │
│ │  ├──────────┼───────┼────────┼───────┼──────────┼────────────┤  │
│ │  │ Pos.2    │ [_5__]│ [_5.2_]│[_4.8_]│ [_28__] │[Comments] │  │
│ │  │ Trailer  │       │        │       │         │[📷 Photo] │  │
│ │  ├──────────┼───────┼────────┼───────┼──────────┼────────────┤  │
│ │  │ Pos.3    │ [____]│ [____] │[____] │ [____] │[Comments] │  │
│ │  │ Trailer  │       │        │       │         │[📷 Photo] │  │
│ │  ├──────────┼───────┼────────┼───────┼──────────┼────────────┤  │
│ │  │ Pos.4    │ [____]│ [____] │[____] │ [____] │[Comments] │  │
│ │  │ Trailer  │       │        │       │         │[📷 Photo] │  │
│ │  │                                                            │  │
│ │  └────────────────────────────────────────────────────────────┘  │
│ │                                                                  │
│ └─ [+ Add Trailer 2]                                               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

[+ ADD VEHICLE]              [✓ Submit All]  [← Cancel]

═══════════════════════════════════════════════════════════════════════
```

### Breadcrumb Navigation Examples:
```
✓ Inspections > Main
  (shows header + vehicle list)

✓ Inspections > Main > Inspection 1 > Main Vehicle > Tires
  (shows just Inspection 1's main vehicle tire grid)

✓ Inspections > Main > Inspection 1 > Trailer 1 > Tires
  (shows just Inspection 1's trailer 1 tire grid)

✓ Inspections > Main > Inspection 2 > Main Vehicle > Tires
  (shows Inspection 2's main vehicle)

User always sees their depth in the form structure
```

---

## IMPLEMENTATION STEPS

1. **Create Backend Draft API Endpoints**
   - `POST /api/drafts` - Create new draft inspection
   - `GET /api/drafts/:draftId` - Retrieve draft data
   - `PUT /api/drafts/:draftId` - Auto-save draft data
   - `POST /api/inspections` - Submit draft as final inspection
   - `DELETE /api/drafts/:draftId` - Delete draft

2. **Create new component structure**
   - `InspectionHeader.js` - Company, Depot, Date, Location
   - `VehicleCard.js` - Container for one inspection (main + trailers)
   - `MainVehicleSection.js` - Main vehicle ID + config + tire grid
   - `TrailerSection.js` - Trailer vehicle ID + config + tire grid
   - `TireGrid.js` - Inline tire inspection table
   - `Breadcrumb.js` - Navigation breadcrumb trail

3. **Refactor InspectionForm state**
   - Replace single vehicle with vehicles array (max 5)
   - Add draftId management
   - Add auto-save debounce timer
   - Add breadcrumb state

4. **Implement auto-save mechanism**
   - Debounce field changes (1-2 seconds)
   - PUT to /api/drafts/:draftId on each change
   - Show save indicator ("Saving..." / "Saved")
   - Handle network failures gracefully

5. **Implement tire grids inline**
   - Show all tire positions based on configuration
   - All fields (depth, pressure, condition, damage, photo) editable inline
   - Auto-save each tire field change
   - Support unlimited spare tires

6. **Add breadcrumb navigation**
   - Show current location in form hierarchy
   - Allow clicking breadcrumbs to navigate between vehicles
   - Update as user navigates

7. **Implement vehicle limit (max 5)**
   - Disable [+ ADD VEHICLE] when 5 vehicles added
   - Show counter "2 of 5 vehicles added"

8. **Update validation logic**
   - Per-vehicle validation
   - Don't require completion before adding next vehicle
   - Only validate required fields on submit

9. **Update submission**
   - Collect all vehicle + tire data from state
   - POST to /api/inspections (mark draft as submitted)
   - Show success and redirect

10. **Test device switching**
    - Start inspection on Device A
    - Switch to Device B
    - Open same inspection ID
    - Verify all data loads correctly

---

## FINAL CONFIRMATIONS

✓ **Trailers are optional** - User adds with [+ Add Trailer] buttons

✓ **Tire editor is inline** - All on one screen with breadcrumbs for navigation

✓ **Max 5 vehicles per inspection** - Enforced in UI and validation

✓ **Auto-save as you type** - Data sent to server every 1-2 seconds

✓ **Device failure protection** - Server stores all drafts, user can resume on any device

✓ **Single screen layout** - No modals, breadcrumbs show navigation depth

✓ **Max 5 vehicles limit** - Counter shows "X of 5 vehicles"

---

## UPDATED FLOW SUMMARY

```
1. User fills header (Company, Depot, Date, Location)
   └─ AUTO-SAVED to server every 2 seconds

2. User clicks [+ ADD VEHICLE]
   └─ New inspection card created, draftId created/updated

3. User enters Vehicle ID
   └─ AUTO-SAVED to server

4. User selects Configuration
   └─ AUTO-SAVED to server + Tire grid appears INLINE

5. User inspects each tire (Depth, Pressure, Condition, Damage, Photo)
   └─ Each change AUTO-SAVED to server
   └─ Breadcrumb shows: Inspection 1 > Main Vehicle > Tires

6. User clicks [+ Add Trailer 1]
   └─ New trailer section appears on same screen

7. User repeats steps 3-5 for trailer
   └─ Trailer data AUTO-SAVED to server
   └─ Breadcrumb shows: Inspection 1 > Trailer 1 > Tires

8. User clicks [+ ADD VEHICLE] for second vehicle (up to 5 total)
   └─ New inspection card created

9. User repeats steps 3-7 for all vehicles

10. User clicks [✓ SUBMIT ALL]
    └─ Status changed from "draft" to "submitted"
    └─ Inspection moved to final inspections table
    └─ Success message shown

11. If device fails at any point:
    └─ User logs in on new device
    └─ Opens same inspection ID
    └─ All draft data loaded from server
    └─ Resumes from last saved state
    └─ No data loss
```

---

**✓ READY FOR IMPLEMENTATION**



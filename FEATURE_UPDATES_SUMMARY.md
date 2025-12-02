# Feature Updates Summary - December 2, 2025

## Changes Implemented

### 1. ✅ Enhanced Image Format Support
**Files Modified:** `server/server.js`
- Added `.jpg` and `.heif`/`.heic` format support (iPhone/Android compatible)
- Updated allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heif`, `image/heic`
- Updated allowed extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.heif`, `.heic`

### 2. ✅ File Upload Error Logging & Toast Notifications
**Files Modified:** `server/server.js`, `client/src/components/InspectionForm.js`
- Added custom `handleUploadErrors` middleware for multer errors
- Implemented error code generation: `FILE_TOO_LARGE_${timestamp}`, `INVALID_FILE_TYPE_${timestamp}`, `NO_FILE_PROVIDED`, `FILE_SAVE_ERROR`
- File size errors logged with:
  - Actual file size in bytes
  - Error code
  - Activity log entry in `user_activity_log` table
- Toast notifications display error messages to users with error codes
- Client-side validation checks file size before upload attempt

### 3. ✅ Mobile Camera Capture Support
**Files Modified:** `client/src/components/InspectionForm.js`
- Added `capture="environment"` attribute to file inputs for direct camera access
- Works on both tire photos and spare wheel photos
- Applied to both normal tire form and spare wheel form
- Supports both rear camera (environment) capture

### 4. ✅ Spare Wheels Management (Spare 1, Spare 2, Spare 3)
**Files Modified:** `client/src/components/InspectionForm.js`
- New `spareItems` state to track spare wheels separately
- Each spare can have:
  - Spare Number (Spare 1, 2, or 3)
  - Tire Size (e.g., 225/75R16)
  - Tread Depth (mm)
  - Current Pressure (bar)
  - Ideal Pressure (bar) - optional
  - Condition (Good, Fair, Poor)
  - Damage/Notes
  - Photo with camera capture
- UI Section showing all spares with quick-add button
- Delete spare functionality
- Draft auto-save includes spare data
- Spares submitted with inspection payload

### 5. ✅ Tab Text Visibility Fix
**Files Modified:** `client/src/pages/admin/AdminDashboard.js`
- Fixed dynamic Tailwind class generation issue
- Created `colorMap` object mapping color codes to actual Tailwind classes
- Applied `text-gray-100` (light gray) to inactive tabs in dark mode instead of white-on-gray problem
- Tab text now properly visible in both light and dark modes
- Company Database and User Database tabs now clearly readable

### 6. ✅ Database Dropdowns for Form Fields
**Files Modified:** `client/src/components/InspectionForm.js`
- Header section now includes dropdowns for:
  - **Company** (optional) - loads from `/api/table/companies`
  - **Depot** (optional) - loads from `/api/table/depots`
- Data auto-loads on component mount
- Reduces duplicate data entry
- Company and depot selection optional (users can still type if not in database)
- Stores `companyId` and `depotId` in inspection payload

### 7. ✅ Enhanced Form Error Handling
**Files Modified:** `client/src/components/InspectionForm.js`
- Integrated `Toast` component for success/error notifications
- Upload errors display with error codes and file sizes
- Success messages for tire/spare saves
- Offline save confirmations
- Better user feedback throughout form submission

### 8. ✅ Draft Persistence with New Fields
**Files Modified:** `client/src/components/InspectionForm.js`
- Draft storage now includes:
  - `spareItems` array
  - `companyId` and `depotId` from dropdown selections
  - `idealPressure` for each tire
  - `tireSize` for each tire
- Auto-save triggered after company/depot selection
- All new fields preserved when resuming draft

### 9. ✅ Build Verification
- Client build completed successfully: `npm run build`
- Production build ready in `build/` folder
- Build size: 276.89 kB (gzipped) for main bundle
- Warnings only about unused variables (non-blocking)

## Files Modified

1. **server/server.js** (~80 lines added)
   - File type whitelist updated
   - Error handling middleware added
   - Activity logging for upload errors
   - Custom error codes for file issues

2. **client/src/components/InspectionForm.js** (complete rewrite)
   - ~1020 lines of new React component code
   - Added spare wheels section with full form
   - Added database dropdowns
   - Added Toast integration
   - Added camera capture support
   - Enhanced draft persistence

3. **client/src/pages/admin/AdminDashboard.js** (~20 lines modified)
   - Fixed tab color styling
   - Added colorMap for Tailwind class generation
   - Improved dark mode text visibility

## Testing Recommendations

### 1. File Uploads
- [ ] Upload JPEG (.jpg)
- [ ] Upload PNG (.png)
- [ ] Upload WebP (.webp)
- [ ] Upload HEIF/HEIC (iPhone photos)
- [ ] Test > 10MB file (should show error with code)
- [ ] Test invalid file type (should show error with code)
- [ ] Check error code in browser console and server logs

### 2. Mobile Features
- [ ] Open form on iPhone
- [ ] Tap photo input - should show "Take Photo" option
- [ ] Open form on Android
- [ ] Tap photo input - should show camera option
- [ ] Verify photos appear in preview

### 3. Spare Wheels
- [ ] Add Spare 1 with all fields
- [ ] Add Spare 2 with different sizes/pressures
- [ ] Add Spare 3
- [ ] Delete a spare - verify others remain
- [ ] Refresh page - verify spares persist in draft
- [ ] Submit inspection - verify spares included in payload

### 4. Database Dropdowns
- [ ] Reload page - company dropdown should populate
- [ ] Select company - should save in draft
- [ ] Select depot - should save in draft
- [ ] Reload page - dropdowns should retain selections

### 5. Tab Visibility
- [ ] Admin > Database tabs
- [ ] Click "Company Database" - text should be readable
- [ ] Click "User Database" - text should be readable
- [ ] Toggle dark mode - tabs should remain readable

### 6. Error Handling
- [ ] Upload 15MB file - toast shows error code
- [ ] Check server logs for error code and file size
- [ ] Try invalid file type - toast shows error

## Pending Tasks

### 1. End-User Data Entry Forms (Not Yet Implemented)
For non-admin users, need to add:
- Modal form to add new Company
- Modal form to add new Depot
- Modal form to add new Tire
- Modal form to add new Vehicle Configuration
- Send admin alert/notification when new items added
- Track "commonly added items" for admin to add to master database

### 2. ScrapPage Updates (Partial)
Consider updating `ScrapPage.js` to also use:
- Company dropdown
- Depot dropdown
- Similar spare wheels handling if applicable

## Deployment Notes

- **Development:** No environment changes required
- **Production:** 
  - Set `SESSION_SECRET` environment variable
  - Set `NODE_ENV=production`
  - Enable HTTPS (file uploads secure over `secure` cookie flag)
  - Update PostgreSQL connection string if needed
  - Run database migrations on first start

## Known Limitations

1. Spare wheels currently only support photos (no video)
2. Camera capture uses `capture="environment"` (rear camera only)
3. Dropdowns populate on mount - no real-time sync if data changes
4. File size validation client-side only (10MB) - server also enforces

## Browser/Device Compatibility

- **iPhone:** Supports camera + HEIF/HEIC formats
- **Android:** Supports camera + JPEG/PNG formats  
- **Desktop:** All formats, file picker only
- **Safari:** Full support
- **Chrome/Firefox:** Full support
- **Edge:** Full support

## Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| `FILE_TOO_LARGE_*` | File exceeds 10MB | User must select smaller file |
| `INVALID_FILE_TYPE_*` | Non-image file uploaded | Only JPEG, PNG, GIF, WebP, HEIF allowed |
| `NO_FILE_PROVIDED` | Form submitted without file | User must select a file |
| `FILE_SAVE_ERROR` | Server error saving file | Retry or contact support |


# ZURI LMS API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All API endpoints require authentication except for login and developer login.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

### Developer Login (Development Mode Only)
```http
POST /api/auth/dev-login
Content-Type: application/json

{
  "role": "Administrator",
  "username": "developer"
}
```

### Get Current User
```http
GET /api/me
```
Returns the current authenticated user information.

## Inspections

### Get All Inspections
```http
GET /api/inspections
```

### Create Inspection
```http
POST /api/inspections
Content-Type: application/json

{
  "vehicleId": "ABC-123",
  "companyId": 1,
  "depotId": 1,
  "tires": [...],
  "notes": "Inspection notes"
}
```

## Scrap Reports

### Get All Scrap Reports
```http
GET /api/scraps
```

### Create Scrap Report
```http
POST /api/scraps
Content-Type: application/json

{
  "companyId": 1,
  "depotId": 1,
  "location": "Warehouse A",
  "items": [...],
  "notes": "Scrap report notes"
}
```

## Tables (Admin Only)

### Get Table Data
```http
GET /api/table/{tableName}
```
Allowed tables: `scraps`, `inspections`, `companies`, `depots`, `vehicle_configs`, `tyres`, `vehicles`

### Create Table Record
```http
POST /api/table/{tableName}
Content-Type: application/json

{
  // Table-specific fields
}
```

### Update Table Record
```http
PUT /api/table/{tableName}/{id}
Content-Type: application/json

{
  // Updated fields
}
```

### Delete Table Record
```http
DELETE /api/table/{tableName}/{id}
```

## Drafts

### Get User Drafts
```http
GET /api/drafts
```

### Save Draft
```http
POST /api/drafts/save
Content-Type: application/json

{
  "formType": "inspection",
  "formName": "Draft Inspection",
  "draftData": { /* form data */ }
}
```

### Delete Draft
```http
DELETE /api/drafts/{id}
```

## File Upload

### Upload File
```http
POST /upload
Content-Type: multipart/form-data

file: [image file]
```

## Export

### Export Table to CSV
```http
GET /export/{tableName}
```

## Error Responses

All endpoints return JSON error responses:
```json
{
  "error": "Error message",
  "stack": "Error stack (development only)"
}
```

## Rate Limiting

- Authentication endpoints: 5 requests per 15 minutes
- General API endpoints: 100 requests per 15 minutes

## CORS

- Development: `http://localhost:3000`, `http://127.0.0.1:3000`
- Production: Configured via `FRONTEND_URL` environment variable
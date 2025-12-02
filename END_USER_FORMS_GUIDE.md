# End-User Data Entry Forms - Implementation Guide

## Overview
This guide covers implementation of data entry forms for non-admin users, allowing them to suggest new companies, depots, tyres, and vehicle configurations. Admin users receive alerts when new items are suggested.

## Database Schema Addition

Add notification table for tracking user suggestions:

```sql
CREATE TABLE IF NOT EXISTS "user_suggestions" (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username TEXT,
  suggestion_type TEXT NOT NULL,
  suggestion_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_reviewed_by INTEGER,
  admin_reviewed_at TIMESTAMP,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suggestions_user_id ON user_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON user_suggestions(status);
CREATE INDEX idx_suggestions_type ON user_suggestions(suggestion_type);
```

## Server API Endpoints (server/server.js)

Add these endpoints to handle user suggestions:

### 1. POST /api/suggestions
Save user suggestion (company/depot/tyre/vehicle config)

```javascript
app.post('/api/suggestions', requireLogin, async (req, res) => {
  try {
    const { suggestion_type, suggestion_data } = req.body;
    
    // Validate
    const validTypes = ['company', 'depot', 'tyre', 'vehicle_config'];
    if (!validTypes.includes(suggestion_type)) {
      return res.status(400).json({ error: 'Invalid suggestion type' });
    }
    
    if (!suggestion_data || Object.keys(suggestion_data).length === 0) {
      return res.status(400).json({ error: 'Suggestion data required' });
    }
    
    // Insert suggestion
    const query = `
      INSERT INTO user_suggestions (user_id, username, suggestion_type, suggestion_data)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at;
    `;
    const result = await pool.query(query, [
      req.session.userId,
      req.logUsername,
      suggestion_type,
      JSON.stringify(suggestion_data)
    ]);
    
    // Log activity
    logActivity(req, {
      activity_type: 'DATA_SUGGESTION',
      activity_description: `User suggested new ${suggestion_type}`,
      table_name: 'user_suggestions',
      record_id: result.rows[0].id,
      request_data: { suggestion_type, suggestion_data },
      success: true
    });
    
    // Send admin alert (email or in-app notification)
    notifyAdmins(`New ${suggestion_type} suggestion from ${req.logUsername}`);
    
    res.json({
      success: true,
      id: result.rows[0].id,
      message: `Your ${suggestion_type} suggestion has been submitted for admin review`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 2. GET /api/suggestions/pending (Admin only)
Retrieve pending suggestions for admin review

```javascript
app.get('/api/suggestions/pending', requireLogin, async (req, res) => {
  // Admin-only check
  if (req.session.role !== 'Administrator' && req.session.role !== 'Group Manager') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const query = `
      SELECT * FROM user_suggestions
      WHERE status = 'pending'
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 3. POST /api/suggestions/:id/approve (Admin only)
Approve a suggestion and add to master database

```javascript
app.post('/api/suggestions/:id/approve', requireLogin, async (req, res) => {
  if (req.session.role !== 'Administrator' && req.session.role !== 'Group Manager') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const suggestionId = req.params.id;
    
    // Get suggestion
    const suggestion = await pool.query(
      'SELECT * FROM user_suggestions WHERE id = $1',
      [suggestionId]
    );
    
    if (!suggestion.rows[0]) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    
    const { suggestion_type, suggestion_data } = suggestion.rows[0];
    
    // Insert into appropriate table based on type
    let insertQuery;
    let tableMap = {
      'company': 'companies',
      'depot': 'depots',
      'tyre': 'tyres',
      'vehicle_config': 'vehicle_configs'
    };
    
    const targetTable = tableMap[suggestion_type];
    const columns = Object.keys(suggestion_data).join(',');
    const values = Object.values(suggestion_data);
    const placeholders = values.map((_, i) => `$${i+1}`).join(',');
    
    insertQuery = `
      INSERT INTO ${targetTable} (${columns})
      VALUES (${placeholders})
      RETURNING id;
    `;
    
    await pool.query(insertQuery, values);
    
    // Update suggestion status
    await pool.query(
      `UPDATE user_suggestions 
       SET status = 'approved', admin_reviewed_by = $1, admin_reviewed_at = NOW()
       WHERE id = $2`,
      [req.session.userId, suggestionId]
    );
    
    logActivity(req, {
      activity_type: 'SUGGESTION_APPROVED',
      activity_description: `Approved ${suggestion_type} suggestion`,
      table_name: 'user_suggestions',
      record_id: suggestionId,
      success: true
    });
    
    res.json({ success: true, message: `${suggestion_type} added to database` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 4. POST /api/suggestions/:id/reject (Admin only)
Reject a suggestion with notes

```javascript
app.post('/api/suggestions/:id/reject', requireLogin, async (req, res) => {
  if (req.session.role !== 'Administrator' && req.session.role !== 'Group Manager') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { admin_notes } = req.body;
    const suggestionId = req.params.id;
    
    await pool.query(
      `UPDATE user_suggestions 
       SET status = 'rejected', admin_reviewed_by = $1, admin_reviewed_at = NOW(), admin_notes = $2
       WHERE id = $3`,
      [req.session.userId, admin_notes || null, suggestionId]
    );
    
    res.json({ success: true, message: 'Suggestion rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Client Components

### 1. Create `client/src/components/DataSuggestionModal.js`

Modal form for non-admin users to suggest new data:

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DataSuggestionModal({ isOpen, onClose, suggestionType, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const fieldsByType = {
    company: ['name', 'contactName', 'email', 'phone'],
    depot: ['location', 'contactName', 'email', 'phone'],
    tyre: ['brand', 'size', 'pattern', 'price'],
    vehicle_config: ['name', 'rows', 'cols'],
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(
        `${BASE_URL}/api/suggestions`,
        { suggestion_type: suggestionType, suggestion_data: formData },
        { withCredentials: true }
      );
      alert('Thank you! Your suggestion has been submitted for admin review.');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Suggest New {suggestionType.charAt(0).toUpperCase() + suggestionType.slice(1)}
        </h2>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fieldsByType[suggestionType]?.map(field => (
            <div key={field}>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type="text"
                name={field}
                value={formData[field] || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          ))}

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DataSuggestionModal;
```

### 2. Add to `client/src/pages/Home.js` (for regular users)

Add buttons to suggest new data:

```javascript
// Add near top of form
<div className="grid grid-cols-4 gap-3 mb-4">
  <button
    type="button"
    onClick={() => setShowCompanySuggestion(true)}
    className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
  >
    + Suggest Company
  </button>
  <button
    type="button"
    onClick={() => setShowDepotSuggestion(true)}
    className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
  >
    + Suggest Depot
  </button>
  <button
    type="button"
    onClick={() => setShowTyreSuggestion(true)}
    className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
  >
    + Suggest Tyre
  </button>
  <button
    type="button"
    onClick={() => setShowConfigSuggestion(true)}
    className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
  >
    + Suggest Config
  </button>
</div>

{/* Modals */}
<DataSuggestionModal isOpen={showCompanySuggestion} suggestionType="company" onClose={() => setShowCompanySuggestion(false)} />
<DataSuggestionModal isOpen={showDepotSuggestion} suggestionType="depot" onClose={() => setShowDepotSuggestion(false)} />
<DataSuggestionModal isOpen={showTyreSuggestion} suggestionType="tyre" onClose={() => setShowTyreSuggestion(false)} />
<DataSuggestionModal isOpen={showConfigSuggestion} suggestionType="vehicle_config" onClose={() => setShowConfigSuggestion(false)} />
```

### 3. Admin panel for reviewing suggestions

Create `client/src/components/admin/SuggestionsPanel.js` for admins to approve/reject suggestions.

## Implementation Steps

1. Add `user_suggestions` table migration to server
2. Add 4 API endpoints to server (POST, GET /pending, POST /approve, POST /reject)
3. Create `DataSuggestionModal.js` component
4. Add modal buttons to `Home.js` for non-admins
5. Create `SuggestionsPanel.js` for admin dashboard
6. Add "Suggestions" tab to admin dashboard
7. Test full workflow: user suggests → admin sees → admin approves → data added

## Admin Notification (Optional Enhancements)

Consider adding:
- Email notifications to admins when suggestions are submitted
- In-app notification badge on admin panel
- Daily digest of pending suggestions
- Analytics: "Most commonly suggested items"

## Approval Workflow

1. User fills form with new data
2. Submitted to `user_suggestions` table with `status='pending'`
3. Admin dashboard shows count of pending suggestions
4. Admin clicks to review, sees user details + suggested data
5. Admin can approve (adds to master table) or reject (with notes)
6. User gets notification of status via activity log


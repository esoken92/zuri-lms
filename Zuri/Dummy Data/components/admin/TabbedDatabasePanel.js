import React from 'react';

function TabbedDatabasePanel({ activeTab }) {
  if (activeTab === 'Dashboard') {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-2">System Status Overview</h3>
        {/* Placeholder for system check, logs, and update info */}
        <p>Service status and error logs will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">{activeTab}</h3>
      {/* Placeholder for dynamic database table */}
      <p>Database table for <strong>{activeTab}</strong> will be loaded here.</p>
    </div>
  );
}

export default TabbedDatabasePanel;

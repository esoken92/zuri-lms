const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// SQLite database path
const dbPath = path.join(__dirname, 'db', 'zuri_dev.db');

async function createDatabase() {
  try {
    // Ensure db directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Created db directory');
    }

    // Check if database file exists
    if (fs.existsSync(dbPath)) {
      console.log('SQLite database zuri_dev.db already exists');
      return;
    }

    console.log('Creating SQLite database...');

    // Create database connection
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error creating SQLite database:', err.message);
        process.exit(1);
      } else {
        console.log('SQLite database zuri_dev.db created successfully!');
      }
    });

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Close the connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });

  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  }
}

createDatabase();
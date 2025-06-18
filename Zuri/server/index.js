const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;


// Ensure 'uploads/' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve static files

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Connect to SQLite database
const db = new sqlite3.Database('./tirecheck.db', (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create table and ensure 'photo' column exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicleId TEXT,
      tirePosition TEXT,
      treadDepth REAL,
      pressure REAL,
      damage TEXT,
      date TEXT
    )
  `, () => {
    // Try to add 'photo' column only if it's not already present
    db.get(`PRAGMA table_info(inspections);`, (err, row) => {
      if (err) return console.error('PRAGMA error:', err.message);

      db.all(`PRAGMA table_info(inspections);`, (err, columns) => {
        if (!columns.some(col => col.name === 'photo')) {
          db.run(`ALTER TABLE inspections ADD COLUMN photo TEXT`, (err) => {
            if (err) {
              console.error('Could not add photo column:', err.message);
            } else {
              console.log('Photo column added to inspections table.');
            }
          });
        }
      });
    });
  });
});

// Upload photo
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.json({
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Get all inspections
app.get('/inspections', (req, res) => {
  db.all('SELECT * FROM inspections', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error retrieving inspections");
    }
    res.json(rows);
  });
});

// Save new inspection
app.post('/inspections', (req, res) => {
  const { vehicleId, tirePosition, treadDepth, pressure, damage, date, photo } = req.body;

  const query = `
    INSERT INTO inspections (vehicleId, tirePosition, treadDepth, pressure, damage, date, photo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [vehicleId, tirePosition, treadDepth, pressure, damage, date, photo];

  db.run(query, values, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send("Failed to save inspection");
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

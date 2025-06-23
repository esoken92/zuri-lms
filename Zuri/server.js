// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

app.use(cors());
app.use(express.json());

app.post('/api/sync/:key', (req, res) => {
  const { key } = req.params;
  const filePath = path.join(DATA_DIR, `${key}.json`);
  fs.writeFile(filePath, JSON.stringify(req.body, null, 2), err => {
    if (err) return res.status(500).send('Failed to write');
    res.send('Saved');
  });
});

app.post('/api/log-survey-event', (req, res) => {
  const logPath = path.join(DATA_DIR, `audit-log-${Date.now()}.json`);
  fs.writeFile(logPath, JSON.stringify(req.body, null, 2), () => {});
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Zuri backend running at http://localhost:${PORT}`);
});

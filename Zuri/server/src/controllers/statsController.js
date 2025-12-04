const { pool } = require('../config/database');

// Get statistics
const getStats = async (req, res) => {
  try {
    const tyreToday = await pool.query("SELECT COUNT(*) FROM tyres WHERE CURRENT_DATE = DATE(created_at)");
    const vehicleTotal = await pool.query("SELECT COUNT(*) FROM vehicles");
    res.json({
      tyres_today: Number(tyreToday.rows[0].count),
      total_vehicles: Number(vehicleTotal.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getStats
};
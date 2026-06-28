const router = require('express').Router();
const pool   = require('../db');

// GET /api/public/cars
router.get('/cars', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id, c.carName, c.plaque, co.name AS companyName, co.whatsapp
       FROM cars c
       LEFT JOIN companies co ON c.companyId = co.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

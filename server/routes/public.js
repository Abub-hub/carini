const router = require('express').Router();
const pool   = require('../db');

// GET /api/public/cars
router.get('/cars', async (req, res) => {
  const { search, minPrice, maxPrice, transmission, fuelType, seats } = req.query;
  const where = [`c.status = 'disponible'`, `NOT EXISTS (
      SELECT 1 FROM location l
      WHERE l.car_id = c.id AND l.status = 'en_cours'
        AND CURDATE() BETWEEN l.dateDebut AND l.dateFin
    )`];
  const params = [];

  if (search) {
    where.push('(c.carName LIKE ? OR c.brand LIKE ? OR c.model LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (minPrice) { where.push('c.dailyPrice >= ?'); params.push(minPrice); }
  if (maxPrice) { where.push('c.dailyPrice <= ?'); params.push(maxPrice); }
  if (transmission) { where.push('c.transmission = ?'); params.push(transmission); }
  if (fuelType) { where.push('c.fuelType = ?'); params.push(fuelType); }
  if (seats) { where.push('c.seats >= ?'); params.push(seats); }

  try {
    const [rows] = await pool.execute(
      `SELECT c.*, co.name AS companyName, co.whatsapp
       FROM cars c
       LEFT JOIN companies co ON c.companyId = co.id
       WHERE ${where.join(' AND ')}
       ORDER BY c.id DESC`,
      params
    );

    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const [images] = await pool.query(
        'SELECT id, car_id, url FROM car_images WHERE car_id IN (?) ORDER BY position ASC, id ASC',
        [ids]
      );
      const byCarId = {};
      for (const img of images) (byCarId[img.car_id] ||= []).push({ id: img.id, url: img.url });
      for (const car of rows) car.images = byCarId[car.id] || [];
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

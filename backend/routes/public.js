const express = require('express');
const router = express.Router();
const getDb = require('../database');

router.get('/cars', async (req, res) => {
  const db = await getDb();
  const cars = await db.all(`
    SELECT c.id, c.carName, c.plaque,
           co.whatsapp, co.name AS companyName
    FROM cars c
    JOIN companies co ON c.company_id = co.id
    ORDER BY c.created_at DESC
  `);
  res.json(cars);
});

module.exports = router;

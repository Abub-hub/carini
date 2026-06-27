const express = require('express');
const router = express.Router();
const getDb = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const db = await getDb();
  const cars = await db.all('SELECT * FROM cars WHERE company_id = ? ORDER BY created_at DESC', [req.company.id]);
  res.json(cars);
});

router.post('/', auth, async (req, res) => {
  const { carName, plaque } = req.body;
  if (!carName || !plaque) return res.status(400).json({ error: 'Nom et plaque requis' });
  try {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO cars (company_id, carName, plaque) VALUES (?, ?, ?)',
      [req.company.id, carName, plaque]
    );
    res.json({ id: result.lastID, carName, plaque });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Cette plaque existe déjà' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { carName, plaque } = req.body;
  try {
    const db = await getDb();
    await db.run(
      'UPDATE cars SET carName = ?, plaque = ? WHERE id = ? AND company_id = ?',
      [carName, plaque, req.params.id, req.company.id]
    );
    const car = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    res.json(car);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Cette plaque existe déjà' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM cars WHERE id = ? AND company_id = ?', [req.params.id, req.company.id]);
  res.json({ success: true });
});

module.exports = router;

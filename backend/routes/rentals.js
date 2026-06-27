const express = require('express');
const router = express.Router();
const getDb = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const db = await getDb();
  const rentals = await db.all(`
    SELECT r.id, r.car_id, r.client_id, r.dateDebut, r.dateFin,
           c.carName, c.plaque,
           cl.nom, cl.prenom
    FROM rentals r
    JOIN cars c ON r.car_id = c.id
    JOIN clients cl ON r.client_id = cl.id
    WHERE r.company_id = ?
    ORDER BY r.created_at DESC
  `, [req.company.id]);
  res.json(rentals);
});

router.post('/', auth, async (req, res) => {
  const { car_id, client_id, dateDebut, dateFin } = req.body;
  if (!car_id || !client_id || !dateDebut || !dateFin) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO rentals (company_id, car_id, client_id, dateDebut, dateFin) VALUES (?, ?, ?, ?, ?)',
    [req.company.id, car_id, client_id, dateDebut, dateFin]
  );
  res.json({ id: result.lastID, car_id, client_id, dateDebut, dateFin });
});

router.delete('/:id', auth, async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM rentals WHERE id = ? AND company_id = ?', [req.params.id, req.company.id]);
  res.json({ success: true });
});

module.exports = router;

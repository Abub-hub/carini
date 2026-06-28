const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/rentals
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT l.*, c.carName, c.plaque, cl.nom, cl.prenom
       FROM location l
       LEFT JOIN cars c  ON l.car_id    = c.id
       LEFT JOIN clients cl ON l.client_id = cl.id
       WHERE l.companyId = ?
       ORDER BY l.id DESC`,
      [req.companyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rentals
router.post('/', auth, async (req, res) => {
  const { car_id, client_id, dateDebut, dateFin } = req.body;
  try {
    const [existing] = await pool.execute(
      'SELECT id FROM location WHERE car_id = ? AND dateDebut <= ? AND dateFin >= ?',
      [car_id, dateFin, dateDebut]
    );
    if (existing.length > 0)
      return res.status(400).json({ error: 'Cette voiture est déjà réservée pour cette période.' });

    const [result] = await pool.execute(
      'INSERT INTO location (car_id, client_id, dateDebut, dateFin, companyId) VALUES (?,?,?,?,?)',
      [car_id, client_id, dateDebut, dateFin, req.companyId]
    );
    res.json({ id: result.insertId, car_id, client_id, dateDebut, dateFin, companyId: req.companyId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/rentals/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM location WHERE id=? AND companyId=?',
      [req.params.id, req.companyId]
    );
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/cars
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM cars WHERE companyId = ? ORDER BY id DESC',
      [req.companyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cars
router.post('/', auth, async (req, res) => {
  const { carName, plaque } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO cars (carName, plaque, companyId) VALUES (?,?,?)',
      [carName, plaque, req.companyId]
    );
    res.json({ id: result.insertId, carName, plaque, companyId: req.companyId });
  } catch {
    res.status(400).json({ error: 'Plaque déjà utilisée' });
  }
});

// PUT /api/cars/:id
router.put('/:id', auth, async (req, res) => {
  const { carName, plaque } = req.body;
  try {
    await pool.execute(
      'UPDATE cars SET carName=?, plaque=? WHERE id=? AND companyId=?',
      [carName, plaque, req.params.id, req.companyId]
    );
    res.json({ id: parseInt(req.params.id), carName, plaque, companyId: req.companyId });
  } catch {
    res.status(400).json({ error: 'Plaque déjà utilisée' });
  }
});

// DELETE /api/cars/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM cars WHERE id=? AND companyId=?',
      [req.params.id, req.companyId]
    );
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

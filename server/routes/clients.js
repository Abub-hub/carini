const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/clients
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM clients WHERE companyId = ? ORDER BY id DESC',
      [req.companyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients
router.post('/', auth, async (req, res) => {
  const { nom, prenom, telephone } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO clients (nom, prenom, telephone, companyId) VALUES (?,?,?,?)',
      [nom, prenom, telephone, req.companyId]
    );
    res.json({ id: result.insertId, nom, prenom, telephone, companyId: req.companyId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM clients WHERE id=? AND companyId=?',
      [req.params.id, req.companyId]
    );
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

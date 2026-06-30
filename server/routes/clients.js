const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');
const { validate } = require('../schemas');

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
router.post('/', auth, validate('client'), async (req, res) => {
  const { nom, prenom, telephone, email, cin, permis, address } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO clients (nom, prenom, telephone, email, cin, permis, address, companyId) VALUES (?,?,?,?,?,?,?,?)',
      [nom, prenom, telephone, email || null, cin || null, permis || null, address || null, req.companyId]
    );
    res.json({ id: result.insertId, nom, prenom, telephone, email: email || null, cin: cin || null, permis: permis || null, address: address || null, companyId: req.companyId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/clients/:id
router.put('/:id', auth, validate('client'), async (req, res) => {
  const { nom, prenom, telephone, email, cin, permis, address } = req.body;
  try {
    await pool.execute(
      'UPDATE clients SET nom=?, prenom=?, telephone=?, email=?, cin=?, permis=?, address=? WHERE id=? AND companyId=?',
      [nom, prenom, telephone, email || null, cin || null, permis || null, address || null, req.params.id, req.companyId]
    );
    res.json({ id: parseInt(req.params.id), nom, prenom, telephone, email: email || null, cin: cin || null, permis: permis || null, address: address || null, companyId: req.companyId });
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

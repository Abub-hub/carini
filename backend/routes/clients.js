const express = require('express');
const router = express.Router();
const getDb = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const db = await getDb();
  const clients = await db.all('SELECT * FROM clients WHERE company_id = ? ORDER BY created_at DESC', [req.company.id]);
  res.json(clients);
});

router.post('/', auth, async (req, res) => {
  const { nom, prenom, telephone } = req.body;
  if (!nom || !prenom || !telephone) {
    return res.status(400).json({ error: 'Nom, prénom et téléphone sont requis' });
  }
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO clients (company_id, nom, prenom, email, telephone, permis) VALUES (?, ?, ?, ?, ?, ?)',
    [req.company.id, nom, prenom, '', telephone, '']
  );
  res.json({ id: result.lastID, nom, prenom, telephone });
});

router.delete('/:id', auth, async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM clients WHERE id = ? AND company_id = ?', [req.params.id, req.company.id]);
  res.json({ success: true });
});

module.exports = router;

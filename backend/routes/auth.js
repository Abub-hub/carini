const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getDb = require('../database');

router.post('/register', async (req, res) => {
  const { name, email, password, whatsapp } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  try {
    const db = await getDb();
    const hash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO companies (name, email, password, whatsapp) VALUES (?, ?, ?, ?)',
      [name, email, hash, whatsapp || '']
    );
    const token = jwt.sign({ id: result.lastID, name, email }, 'carini_secret', { expiresIn: '7d' });
    res.json({ token, company: { id: result.lastID, name, email, whatsapp } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email déjà utilisé' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await getDb();
    const company = await db.get('SELECT * FROM companies WHERE email = ?', [email]);
    if (!company) return res.status(400).json({ error: 'Identifiants invalides' });

    const valid = await bcrypt.compare(password, company.password);
    if (!valid) return res.status(400).json({ error: 'Identifiants invalides' });

    const token = jwt.sign({ id: company.id, name: company.name, email: company.email }, 'carini_secret', { expiresIn: '7d' });
    res.json({ token, company: { id: company.id, name: company.name, email: company.email, whatsapp: company.whatsapp } });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

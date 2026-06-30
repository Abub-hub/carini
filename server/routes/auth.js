require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { validate } = require('../schemas');

const JWT_SECRET = process.env.JWT_SECRET || 'carini_secret_key';

// POST /api/auth/register
router.post('/register', validate('register'), async (req, res) => {
  const { name, email, password, whatsapp } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO companies (name, email, password, whatsapp) VALUES (?,?,?,?)',
      [name, email, hash, whatsapp || null]
    );
    res.json({ id: result.insertId });
  } catch {
    res.status(400).json({ error: 'Email déjà utilisé' });
  }
});

// POST /api/auth/login
router.post('/login', validate('login'), async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM companies WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Identifiants invalides' });
    const company = rows[0];
    const valid = await bcrypt.compare(password, company.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });
    const token = jwt.sign({ companyId: company.id, email: company.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      company: { id: company.id, name: company.name, email: company.email, whatsapp: company.whatsapp }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

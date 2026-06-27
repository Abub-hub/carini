const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const JWT_SECRET = 'carini_secret_key';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'carini3',
  waitForConnections: true,
  connectionLimit: 10
});

// JWT auth middleware for car rental routes
const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.companyId = decoded.companyId;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ===== OLD AUTH (employee app) =====
app.post('/api/register', async (req, res) => {
  const { name, email, password, director } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO companies (name, email, password, director) VALUES (?,?,?,?)',
      [name, email, password, director]
    );
    res.json({ id: result.insertId });
  } catch {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM companies WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const row = rows[0];
    res.json({ token: 'token-' + Date.now(), company: { id: row.id, name: row.name, email: row.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CARINI AUTH =====
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, whatsapp } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO companies (name, email, password, whatsapp) VALUES (?,?,?,?)',
      [name, email, password, whatsapp || null]
    );
    res.json({ id: result.insertId });
  } catch {
    res.status(400).json({ error: 'Email déjà utilisé' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM companies WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) return res.status(401).json({ error: 'Identifiants invalides' });
    const company = rows[0];
    const token = jwt.sign({ companyId: company.id, email: company.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, company: { id: company.id, name: company.name, email: company.email, whatsapp: company.whatsapp } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== PUBLIC =====
app.get('/api/public/cars', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id, c.carName, c.plaque, co.name AS companyName, co.whatsapp
       FROM cars c
       LEFT JOIN companies co ON c.companyId = co.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CARS (protected) =====
app.get('/api/cars', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM cars WHERE companyId = ? ORDER BY id DESC', [req.companyId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cars', auth, async (req, res) => {
  const { carName, plaque } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO cars (carName, plaque, companyId) VALUES (?,?,?)',
      [carName, plaque, req.companyId]
    );
    res.json({ id: result.insertId, carName, plaque, companyId: req.companyId });
  } catch (err) {
    res.status(400).json({ error: 'Plaque déjà utilisée' });
  }
});

app.put('/api/cars/:id', auth, async (req, res) => {
  const { carName, plaque } = req.body;
  try {
    await pool.execute(
      'UPDATE cars SET carName=?, plaque=? WHERE id=? AND companyId=?',
      [carName, plaque, req.params.id, req.companyId]
    );
    res.json({ id: parseInt(req.params.id), carName, plaque, companyId: req.companyId });
  } catch (err) {
    res.status(400).json({ error: 'Plaque déjà utilisée' });
  }
});

app.delete('/api/cars/:id', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM cars WHERE id=? AND companyId=?', [req.params.id, req.companyId]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CLIENTS (protected) =====
app.get('/api/clients', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM clients WHERE companyId = ? ORDER BY id DESC', [req.companyId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', auth, async (req, res) => {
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

app.delete('/api/clients/:id', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM clients WHERE id=? AND companyId=?', [req.params.id, req.companyId]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== RENTALS (protected) =====
app.get('/api/rentals', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT l.*, c.carName, c.plaque, cl.nom, cl.prenom
       FROM location l
       LEFT JOIN cars c ON l.car_id = c.id
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

app.post('/api/rentals', auth, async (req, res) => {
  const { car_id, client_id, dateDebut, dateFin } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO location (car_id, client_id, dateDebut, dateFin, companyId) VALUES (?,?,?,?,?)',
      [car_id, client_id, dateDebut, dateFin, req.companyId]
    );
    res.json({ id: result.insertId, car_id, client_id, dateDebut, dateFin, companyId: req.companyId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/rentals/:id', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM location WHERE id=? AND companyId=?', [req.params.id, req.companyId]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== EMPLOYEES (old app) =====
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM employees');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/employees', async (req, res) => {
  const { firstName, lastName, email, password, age, gender, companyId } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO employees (firstName, lastName, email, password, age, gender, companyId) VALUES (?,?,?,?,?,?,?)',
      [firstName, lastName, email, password, age, gender, companyId]
    );
    res.json({ id: result.insertId });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== COMPUTERS (old app) =====
app.get('/api/computers', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM computers');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/computers', async (req, res) => {
  const { mac, employeeId, companyId } = req.body;
  try {
    const [result] = await pool.execute('INSERT INTO computers (mac, employeeId, companyId) VALUES (?,?,?)', [mac, employeeId || null, companyId || null]);
    res.json({ id: result.insertId });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/computers/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM computers WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

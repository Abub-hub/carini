const router = require('express').Router();
const fs     = require('fs');
const path   = require('path');
const pool   = require('../db');
const auth   = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate } = require('../schemas');

const CAR_FIELDS = ['carName', 'plaque', 'brand', 'model', 'year', 'color', 'fuelType', 'transmission', 'seats', 'mileage', 'dailyPrice', 'status', 'description'];

function pickCarFields(body) {
  const out = {};
  for (const f of CAR_FIELDS) out[f] = body[f] === undefined || body[f] === '' ? null : body[f];
  out.carName    = body.carName;
  out.plaque     = body.plaque;
  out.dailyPrice = body.dailyPrice;
  out.status     = body.status || 'disponible';
  return out;
}

async function attachImages(cars) {
  if (cars.length === 0) return cars;
  const ids = cars.map(c => c.id);
  const [images] = await pool.query(
    `SELECT id, car_id, url FROM car_images WHERE car_id IN (?) ORDER BY position ASC, id ASC`,
    [ids]
  );
  const byCarId = {};
  for (const img of images) (byCarId[img.car_id] ||= []).push({ id: img.id, url: img.url });
  return cars.map(c => ({ ...c, images: byCarId[c.id] || [] }));
}

// GET /api/cars
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*,
        EXISTS(
          SELECT 1 FROM location l
          WHERE l.car_id = c.id AND l.status = 'en_cours'
            AND CURDATE() BETWEEN l.dateDebut AND l.dateFin
        ) AS currentlyRented
       FROM cars c WHERE c.companyId = ? ORDER BY c.id DESC`,
      [req.companyId]
    );
    res.json(await attachImages(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cars
router.post('/', auth, validate('car'), async (req, res) => {
  const f = pickCarFields(req.body);
  try {
    const [result] = await pool.execute(
      `INSERT INTO cars (carName, plaque, brand, model, year, color, fuelType, transmission, seats, mileage, dailyPrice, status, description, companyId)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [f.carName, f.plaque, f.brand, f.model, f.year, f.color, f.fuelType, f.transmission, f.seats, f.mileage, f.dailyPrice, f.status, f.description, req.companyId]
    );
    res.json({ id: result.insertId, ...f, companyId: req.companyId, images: [] });
  } catch {
    res.status(400).json({ error: 'Plaque déjà utilisée' });
  }
});

// PUT /api/cars/:id
router.put('/:id', auth, validate('car'), async (req, res) => {
  const f = pickCarFields(req.body);
  try {
    await pool.execute(
      `UPDATE cars SET carName=?, plaque=?, brand=?, model=?, year=?, color=?, fuelType=?, transmission=?, seats=?, mileage=?, dailyPrice=?, status=?, description=?
       WHERE id=? AND companyId=?`,
      [f.carName, f.plaque, f.brand, f.model, f.year, f.color, f.fuelType, f.transmission, f.seats, f.mileage, f.dailyPrice, f.status, f.description, req.params.id, req.companyId]
    );
    const [car] = await attachImages([{ id: parseInt(req.params.id), ...f, companyId: req.companyId }]);
    res.json(car || { id: parseInt(req.params.id), ...f, companyId: req.companyId });
  } catch {
    res.status(400).json({ error: 'Plaque déjà utilisée' });
  }
});

// DELETE /api/cars/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [images] = await pool.execute(
      `SELECT ci.url FROM car_images ci JOIN cars c ON ci.car_id = c.id WHERE c.id = ? AND c.companyId = ?`,
      [req.params.id, req.companyId]
    );
    await pool.execute('DELETE FROM cars WHERE id=? AND companyId=?', [req.params.id, req.companyId]);
    for (const img of images) {
      const filePath = path.join(__dirname, '..', img.url);
      fs.unlink(filePath, () => {});
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cars/:id/images
router.post('/:id/images', auth, upload.array('images', 8), async (req, res) => {
  try {
    const [[car]] = await pool.execute('SELECT id FROM cars WHERE id=? AND companyId=?', [req.params.id, req.companyId]);
    if (!car) {
      for (const file of req.files || []) fs.unlink(file.path, () => {});
      return res.status(404).json({ error: 'Voiture introuvable' });
    }
    const [[{ maxPos }]] = await pool.execute(
      'SELECT COALESCE(MAX(position), -1) AS maxPos FROM car_images WHERE car_id = ?', [req.params.id]
    );
    let position = maxPos + 1;
    const inserted = [];
    for (const file of req.files || []) {
      const url = `/uploads/cars/${file.filename}`;
      const [result] = await pool.execute(
        'INSERT INTO car_images (car_id, url, position) VALUES (?,?,?)',
        [req.params.id, url, position++]
      );
      inserted.push({ id: result.insertId, url });
    }
    res.json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/cars/:id/images/:imageId
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const [[img]] = await pool.execute(
      `SELECT ci.id, ci.url FROM car_images ci
       JOIN cars c ON ci.car_id = c.id
       WHERE ci.id = ? AND ci.car_id = ? AND c.companyId = ?`,
      [req.params.imageId, req.params.id, req.companyId]
    );
    if (!img) return res.status(404).json({ error: 'Image introuvable' });
    await pool.execute('DELETE FROM car_images WHERE id = ?', [img.id]);
    fs.unlink(path.join(__dirname, '..', img.url), () => {});
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

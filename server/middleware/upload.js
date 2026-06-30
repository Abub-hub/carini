const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const carsUploadDir = path.join(__dirname, '../uploads/cars');
if (!fs.existsSync(carsUploadDir)) fs.mkdirSync(carsUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carsUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const allowedTypes = /jpeg|jpg|png|webp|gif/;

function fileFilter(req, file, cb) {
  const ok = allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
             allowedTypes.test(file.mimetype);
  cb(ok ? null : new Error('Format d\'image non supporté (jpg, png, webp, gif uniquement)'), ok);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }
});

module.exports = upload;

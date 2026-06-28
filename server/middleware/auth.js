const jwt = require('jsonwebtoken');

const JWT_SECRET = 'carini_secret_key';

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Non autorisé' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.companyId = decoded.companyId;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

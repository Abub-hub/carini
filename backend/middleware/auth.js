const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non autorisé' });

  try {
    req.company = jwt.verify(token, 'carini_secret');
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

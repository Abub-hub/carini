const schemas = {
  car:      { required: ['carName', 'plaque', 'dailyPrice'] },
  client:   { required: ['nom', 'prenom', 'telephone'] },
  rental:   { required: ['car_id', 'client_id', 'dateDebut', 'dateFin'] },
  register: { required: ['name', 'email', 'password'] },
  login:    { required: ['email', 'password'] },
};

function validate(schemaName) {
  const schema = schemas[schemaName];
  return (req, res, next) => {
    const missing = schema.required.filter(f => req.body[f] === undefined || req.body[f] === '');
    if (missing.length)
      return res.status(400).json({ error: `Champs manquants: ${missing.join(', ')}` });
    next();
  };
}

module.exports = { validate };

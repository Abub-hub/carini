const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const authRoutes    = require('./routes/auth');
const publicRoutes  = require('./routes/public');
const carsRoutes    = require('./routes/cars');
const clientsRoutes = require('./routes/clients');
const rentalsRoutes = require('./routes/rentals');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth',    authRoutes);
app.use('/api/public',  publicRoutes);
app.use('/api/cars',    carsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/rentals', rentalsRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

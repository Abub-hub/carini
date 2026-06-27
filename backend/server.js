const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/cars',    require('./routes/cars'));
app.use('/api/rentals', require('./routes/rentals'));
app.use('/api/public',  require('./routes/public'));

app.listen(3001, () => console.log('Carini backend sur http://localhost:3001'));

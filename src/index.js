const express = require('express');
const morgan = require('morgan');
require('dotenv').config(); // ← Asegura que .env se cargue

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Middlewares para
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// app.use(passport.initialize()); // ← listo para activar si usas autenticación

// Rutas
routes(app);

// Manejo de errores
app.use((err, req, res, next) => {
  return res.status(500).json({ error: err.message });
});

// Servidor
app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});
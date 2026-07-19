const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const productRoutes = require('./routes/productRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/products', productRoutes);
  app.use('/api/admin/products', adminProductRoutes);
  app.use('/api/auth', authRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;

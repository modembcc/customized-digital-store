const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/products', productRoutes);
  app.use('/api/admin/products', adminProductRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;

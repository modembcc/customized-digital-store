require('dotenv').config();
const createApp = require('./app');
const { connectDB } = require('./config/db');
const Product = require('./models/Product');
const mockProducts = require('./data/mockProducts');

const PORT = process.env.PORT || 5000;

// No real database has been provided yet: fall back to an in-memory MongoDB
// seeded with mock products so the app is runnable with zero DB setup.
// Data does not persist across restarts. Set MONGODB_URI in server/.env to
// use a real database instead.
async function connectWithFallback() {
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      console.log(`Connected to MongoDB at ${process.env.MONGODB_URI}`);
      return;
    } catch (err) {
      console.warn(`Could not connect to MONGODB_URI (${err.message}).`);
    }
  }

  console.warn('Falling back to an in-memory MongoDB seeded with mock products (see server/.env.example to use a real database).');
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());
  await Product.insertMany(mockProducts);
}

async function start() {
  await connectWithFallback();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();

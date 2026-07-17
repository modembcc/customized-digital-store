require('dotenv').config();
const createApp = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    console.error('Set MONGODB_URI in server/.env (see .env.example) — falling back to mock data only via API is not yet enabled.');
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();

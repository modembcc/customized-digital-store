require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const Product = require('./models/Product');
const mockProducts = require('./data/mockProducts');

async function seed() {
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany(mockProducts);
  console.log(`Seeded ${mockProducts.length} products`);
  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});

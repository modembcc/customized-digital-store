// Seed/mock data used until a real MongoDB instance is connected.
const mockProducts = [
  {
    name: 'Wireless Headphones',
    description: 'Over-ear wireless headphones with active noise cancellation.',
    price: 89.99,
    category: 'Electronics',
    sku: 'ELEC-001',
    stock: 25,
    imageUrl: 'https://placehold.co/400x400?text=Headphones',
  },
  {
    name: 'Mechanical Keyboard',
    description: 'Tenkeyless mechanical keyboard with hot-swappable switches.',
    price: 129.5,
    category: 'Electronics',
    sku: 'ELEC-002',
    stock: 14,
    imageUrl: 'https://placehold.co/400x400?text=Keyboard',
  },
  {
    name: 'Ceramic Coffee Mug',
    description: '12oz matte-finish ceramic mug, dishwasher safe.',
    price: 14.0,
    category: 'Home',
    sku: 'HOME-001',
    stock: 60,
    imageUrl: 'https://placehold.co/400x400?text=Mug',
  },
  {
    name: 'Canvas Tote Bag',
    description: 'Durable canvas tote bag with reinforced straps.',
    price: 22.0,
    category: 'Accessories',
    sku: 'ACC-001',
    stock: 40,
    imageUrl: 'https://placehold.co/400x400?text=Tote+Bag',
  },
];

module.exports = mockProducts;

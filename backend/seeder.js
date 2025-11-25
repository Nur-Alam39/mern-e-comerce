const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const Category = require('./models/Category');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const adjectives = ['Super', 'Mega', 'Ultra', 'Compact', 'Smart', 'Eco', 'Pro', 'Mini', 'Max', 'Deluxe'];
const nouns = ['Phone', 'Laptop', 'Headphone', 'Camera', 'Watch', 'Speaker', 'Bag', 'Shoes', 'Jacket', 'Bottle'];

async function seed() {
  await connectDB();
  try {
    console.log('Clearing products and categories...');
    await Product.deleteMany({});
    await Category.deleteMany({});

    // create some categories
    const cats = ['Electronics', 'Phones', 'Laptops', 'Fashion', 'Men', 'Women', 'Home', 'Kitchen'];
    const createdCats = [];
    for (const name of cats.slice(0, 5)) {
      const c = new Category({ name });
      await c.save();
      createdCats.push(c);
    }

    console.log('Creating products...');
    const items = [];
    for (let i = 0; i < 100; i++) {
      const name = `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]} ${i + 1}`;
      const price = Math.round((Math.random() * 495 + 5) * 100) / 100;
      const stock = Math.floor(Math.random() * 100);
      const category = createdCats[i % createdCats.length]._id;
      const featured = Math.random() < 0.2;
      const newArrival = Math.random() < 0.2;
      const bestSelling = Math.random() < 0.2;
      const images = []; // no uploaded images in seeder
      items.push({ name, description: name + ' description', price, stock, category, featured, newArrival, bestSelling, images });
    }

    await Product.insertMany(items);
    // create an admin user for dev
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash('password', 10);
      const adminUser = new User({ name: 'Admin', email: adminEmail, password: hashed, isAdmin: true });
      await adminUser.save();
      console.log('Created admin user: admin@example.com / password');
    }
    console.log('Seed finished.');
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

seed();

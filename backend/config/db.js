const mongoose = require('mongoose');
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern_ecommerce';
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.log('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
module.exports = connectDB;

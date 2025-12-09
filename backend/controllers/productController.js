const mongoose = require('mongoose');
const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, featured, newArrival, bestSelling, active, discountedPrice } = req.body;
    const images = [];
    if (req.files && req.files.length) {
      req.files.forEach(f => images.push('/uploads/' + f.filename));
    }
    const product = new Product({ name, description, price, stock, category, featured, newArrival, bestSelling, active, discountedPrice, images });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { category, featured, newArrival, bestSelling, search, minPrice, maxPrice, inStock, sort, active } = req.query;
    const filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    // support query flags like ?featured=true
    if (typeof featured !== 'undefined') {
      if (featured === 'true' || featured === '1') filter.featured = true;
      else if (featured === 'false' || featured === '0') filter.featured = false;
    }
    if (typeof newArrival !== 'undefined') {
      if (newArrival === 'true' || newArrival === '1') filter.newArrival = true;
      else if (newArrival === 'false' || newArrival === '0') filter.newArrival = false;
    }
    if (typeof bestSelling !== 'undefined') {
      if (bestSelling === 'true' || bestSelling === '1') filter.bestSelling = true;
      else if (bestSelling === 'false' || bestSelling === '0') filter.bestSelling = false;
    }
    if (typeof active !== 'undefined') {
      if (active === 'true' || active === '1') filter.active = true;
      else if (active === 'false' || active === '0') filter.active = false;
    }

    // inStock filter (stock > 0)
    if (typeof inStock !== 'undefined') {
      if (inStock === 'true' || inStock === '1') filter.stock = { $gt: 0 };
      else if (inStock === 'false' || inStock === '0') {
        // no-op: don't filter out of stock specifically
      }
    }

    // Price filters
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };

    // pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const total = await Product.countDocuments(filter);
    const pages = Math.ceil(total / limit) || 1;
    // build query and apply sort if provided
    let query = Product.find(filter).populate('category');

    // support sort param (e.g. sort=price_asc, price_desc, newest, oldest, name_asc, name_desc)
    if (sort) {
      const map = {
        'price_asc': { price: 1 },
        'price_desc': { price: -1 },
        'newest': { createdAt: -1 },
        'oldest': { createdAt: 1 },
        'name_asc': { name: 1 },
        'name_desc': { name: -1 }
      };
      const sortObj = map[sort] || null;
      if (sortObj) query = query.sort(sortObj);
    }

    const products = await query
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json({ products, page, pages, total });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { name, description, price, stock, category, featured, newArrival, bestSelling, active, discountedPrice, existingImages } = req.body;
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;
    product.category = category || product.category;
    product.featured = featured !== undefined ? featured : product.featured;
    product.newArrival = newArrival !== undefined ? newArrival : product.newArrival;
    product.bestSelling = bestSelling !== undefined ? bestSelling : product.bestSelling;
    product.active = active !== undefined ? active : product.active;
    product.discountedPrice = discountedPrice || product.discountedPrice;
    const newImages = [];
    if (req.files && req.files.length) {
      req.files.forEach(f => newImages.push('/uploads/' + f.filename));
    }
    let existing = [];
    if (existingImages) {
      try { existing = JSON.parse(existingImages); } catch (e) { existing = []; }
    }
    product.images = [...existing, ...newImages];
    await product.save();
    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.remove();
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

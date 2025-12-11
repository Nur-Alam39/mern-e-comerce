const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
  try {
    const { name, parent, main, showInNavbar, slug } = req.body;
    let image = null;
    if (req.file) image = '/uploads/' + req.file.filename;
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const category = new Category({
      name,
      slug: generatedSlug,
      parent: parent || null,
      main: main === 'true' || main === true,
      showInNavbar: showInNavbar === 'true' || showInNavbar === true,
      image
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { main, showInNavbar, parent } = req.query;
    const filter = {};
    if (typeof main !== 'undefined') {
      if (main === 'true' || main === '1') filter.main = true;
      else if (main === 'false' || main === '0') filter.main = false;
    }
    if (typeof showInNavbar !== 'undefined') {
      if (showInNavbar === 'true' || showInNavbar === '1') filter.showInNavbar = true;
      else if (showInNavbar === 'false' || showInNavbar === '0') filter.showInNavbar = false;
    }
    if (parent) {
      if (parent === 'null') filter.parent = null;
      else filter.parent = parent;
    }
    const categories = await Category.find(filter).populate('parent', 'name').lean();
    res.json(categories);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).lean();
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    category.name = req.body.name || category.name;
    if (req.body.slug) category.slug = req.body.slug;
    category.parent = req.body.parent || category.parent;
    if (typeof req.body.main !== 'undefined') category.main = req.body.main === 'true' || req.body.main === true;
    if (typeof req.body.showInNavbar !== 'undefined') category.showInNavbar = req.body.showInNavbar === 'true' || req.body.showInNavbar === true;
    if (req.file) category.image = '/uploads/' + req.file.filename;
    await category.save();
    res.json(category);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Check if category has products
    const Product = require('../models/Product');
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with existing products' });
    }

    // Check if category has subcategories
    const subcategoriesCount = await Category.countDocuments({ parent: req.params.id });
    if (subcategoriesCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with subcategories' });
    }

    await category.remove();
    res.json({ message: 'Category removed' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

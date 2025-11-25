const Page = require('../models/Page');

exports.createPage = async (req, res) => {
  try {
    const { title, slug, content, active } = req.body;
    const page = new Page({ title, slug, content, active });
    await page.save();
    res.status(201).json(page);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPages = async (req, res) => {
  try {
    const pages = await Page.find().sort({ createdAt: -1 });
    res.json(pages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPageById = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(page);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPageBySlug = async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug, active: true });
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(page);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    const { title, slug, content, active } = req.body;
    page.title = title || page.title;
    page.slug = slug || page.slug;
    page.content = content || page.content;
    page.active = active !== undefined ? active : page.active;
    await page.save();
    res.json(page);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    await page.remove();
    res.json({ message: 'Page removed' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};
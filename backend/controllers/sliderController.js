const Slider = require('../models/Slider');

exports.getSliders = async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ order: 1 }).lean();
    res.json(sliders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createSlider = async (req, res) => {
  try {
    const { title, subtitle, ctaText, ctaLink, order } = req.body;
    let image = null;
    if (req.file) image = '/uploads/' + req.file.filename;
    const slider = new Slider({ title, subtitle, image, ctaText, ctaLink, order });
    await slider.save();
    res.status(201).json(slider);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ message: 'Slider not found' });
    const { title, subtitle, ctaText, ctaLink, order } = req.body;
    slider.title = title || slider.title;
    slider.subtitle = subtitle || slider.subtitle;
    slider.ctaText = ctaText || slider.ctaText;
    slider.ctaLink = ctaLink || slider.ctaLink;
    slider.order = order !== undefined ? order : slider.order;
    if (req.file) slider.image = '/uploads/' + req.file.filename;
    await slider.save();
    res.json(slider);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ message: 'Slider not found' });
    await slider.remove();
    res.json({ message: 'Slider removed' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const ProductVariation = require('../models/ProductVariation');

exports.getVariations = async (req, res) => {
    try {
        const { productId } = req.params;
        const variations = await ProductVariation.find({ product: productId }).sort('size');
        res.json(variations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createVariation = async (req, res) => {
    try {
        const { productId } = req.params;
        const { size, stock, price } = req.body;

        if (!size || stock === undefined || !price) {
            return res.status(400).json({ message: 'Size, stock, and price are required' });
        }

        const variation = new ProductVariation({ product: productId, size, stock, price });
        await variation.save();
        res.status(201).json(variation);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateVariation = async (req, res) => {
    try {
        const { id } = req.params;
        const { size, stock, price } = req.body;

        const variation = await ProductVariation.findByIdAndUpdate(
            id,
            { size, stock, price },
            { new: true }
        );

        if (!variation) return res.status(404).json({ message: 'Variation not found' });
        res.json(variation);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteVariation = async (req, res) => {
    try {
        const { id } = req.params;
        const variation = await ProductVariation.findByIdAndDelete(id);

        if (!variation) return res.status(404).json({ message: 'Variation not found' });
        res.json({ message: 'Variation deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

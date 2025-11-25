const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({
                currency: 'USD',
                paymentMethods: [
                    { name: 'bkash', enabled: true },
                    { name: 'nagad', enabled: false },
                    { name: 'ssl_commerce', enabled: false }
                ]
            });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { brandName, currency, paymentMethods, address, whatsapp } = req.body;
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings();
        }

        if (brandName !== undefined) settings.brandName = brandName;
        if (req.body.primaryColor !== undefined) settings.primaryColor = req.body.primaryColor;
        if (req.body.secondaryColor !== undefined) settings.secondaryColor = req.body.secondaryColor;
        if (currency) settings.currency = currency;
        if (paymentMethods) {
            try {
                settings.paymentMethods = typeof paymentMethods === 'string' ? JSON.parse(paymentMethods) : paymentMethods;
            } catch (e) {
                settings.paymentMethods = paymentMethods;
            }
        }
        if (req.body.courierProviders) {
            try {
                settings.courierProviders = typeof req.body.courierProviders === 'string' ? JSON.parse(req.body.courierProviders) : req.body.courierProviders;
            } catch (e) {
                settings.courierProviders = req.body.courierProviders;
            }
        }
        if (req.body.socialLinks) {
            try {
                settings.socialLinks = typeof req.body.socialLinks === 'string' ? JSON.parse(req.body.socialLinks) : req.body.socialLinks;
            } catch (e) {
                settings.socialLinks = req.body.socialLinks;
            }
        }
        if (req.body.facebookPixelId !== undefined) settings.facebookPixelId = req.body.facebookPixelId;
        if (req.body.productListPagination) settings.productListPagination = req.body.productListPagination;
        if (address !== undefined) settings.address = address;
        if (whatsapp !== undefined) settings.whatsapp = whatsapp;
        if (req.file) settings.brandLogo = '/uploads/' + req.file.filename;

        await settings.save();
        res.json(settings);
    } catch (err) {
        console.error('Settings validation error:', err);
        res.status(400).json({ message: 'Settings validation failed', error: err.message });
    }
};

exports.updatePaymentMethod = async (req, res) => {
    try {
        const { methodName } = req.params;
        const { enabled, config } = req.body;

        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        const method = settings.paymentMethods.find(m => m.name === methodName);
        if (method) {
            if (enabled !== undefined) method.enabled = enabled;
            if (config) {
                try {
                    method.config = typeof config === 'string' ? JSON.parse(config) : config;
                } catch (e) {
                    method.config = config;
                }
            }
            if (req.file) method.logo = '/uploads/' + req.file.filename;
        } else {
            const logo = req.file ? '/uploads/' + req.file.filename : '';
            let parsedConfig = {};
            if (config) {
                try {
                    parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;
                } catch (e) {
                    parsedConfig = config;
                }
            }
            settings.paymentMethods.push({ name: methodName, enabled: enabled || false, config: parsedConfig, logo });
        }

        await settings.save();
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateCourierProvider = async (req, res) => {
    try {
        const { name } = req.params;
        const { enabled, config } = req.body;

        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();

        const cp = settings.courierProviders.find(c => c.name === name);
        if (cp) {
            if (enabled !== undefined) cp.enabled = enabled;
            if (config) cp.config = config;
        } else {
            settings.courierProviders.push({ name, enabled: !!enabled, config: config || {} });
        }

        await settings.save();
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

import React, { useEffect, useState } from 'react';
import axios from '../utils/api';

export default function AdminSettings() {
    // Helper function to get full image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `${axios.defaults.baseURL}${imagePath}`;
    };
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currency, setCurrency] = useState('USD');
    // payment methods moved to separate admin page
    const [brandName, setBrandName] = useState('MERN Shop');
    const [primaryColor, setPrimaryColor] = useState('#007bff');
    const [secondaryColor, setSecondaryColor] = useState('#6c757d');
    const [socialLinks, setSocialLinks] = useState([]);
    const [facebookPixelId, setFacebookPixelId] = useState('');
    const [productListPagination, setProductListPagination] = useState('numbered');
    const [address, setAddress] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [brandLogo, setBrandLogo] = useState(null);
    const [brandLogoPreview, setBrandLogoPreview] = useState('');


    const socialIconOptions = [
        { name: 'Facebook', icon: 'fab fa-facebook' },
        { name: 'Twitter', icon: 'fab fa-twitter' },
        { name: 'Instagram', icon: 'fab fa-instagram' },
        { name: 'LinkedIn', icon: 'fab fa-linkedin' },
        { name: 'YouTube', icon: 'fab fa-youtube' },
        { name: 'TikTok', icon: 'fab fa-tiktok' },
        { name: 'WhatsApp', icon: 'fab fa-whatsapp' },
        { name: 'Telegram', icon: 'fab fa-telegram' },
        { name: 'Pinterest', icon: 'fab fa-pinterest' },
        { name: 'Snapchat', icon: 'fab fa-snapchat' }
    ];

    // const paymentMethodOptions = ['bkash', 'nagad', 'ssl_commerce'];

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await axios.get('/api/settings');
            setSettings(res.data);
            setCurrency(res.data.currency || 'USD');
            setBrandName(res.data.brandName || 'MERN Shop');
            setPrimaryColor(res.data.primaryColor || '#007bff');
            setSecondaryColor(res.data.secondaryColor || '#6c757d');
            setSocialLinks(res.data.socialLinks || []);
            setFacebookPixelId(res.data.facebookPixelId || '');
            setProductListPagination(res.data.productListPagination || 'numbered');
            setAddress(res.data.address || '');
            setWhatsapp(res.data.whatsapp || '');
            setBrandLogoPreview(res.data.brandLogo || '');
        } catch (err) {
            console.log('Failed to load settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('currency', currency);
            formData.append('brandName', brandName);
            formData.append('primaryColor', primaryColor);
            formData.append('secondaryColor', secondaryColor);
            formData.append('socialLinks', JSON.stringify(socialLinks));
            formData.append('facebookPixelId', facebookPixelId);
            formData.append('productListPagination', productListPagination);
            formData.append('address', address);
            formData.append('whatsapp', whatsapp);
            if (brandLogo) {
                formData.append('brandLogo', brandLogo);
            }
            await axios.put('/api/settings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Settings saved successfully');
            await loadSettings();
        } catch (err) {
            console.log('Failed to save settings', err);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // payment method toggles moved to AdminPayments page

    if (loading) return <p>Loading...</p>;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Settings</h3>
                <button
                    className="btn btn-primary"
                    onClick={handleSaveSettings}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Brand & Theme Settings */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>Brand & Theme Settings</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Brand Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        placeholder="Enter brand name"
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Primary Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        title="Choose primary color"
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Secondary Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        title="Choose secondary color"
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-4">
                                    <small className="text-muted">Brand name displayed in header and throughout the site</small>
                                </div>
                                <div className="col-md-4">
                                    <small className="text-muted">Primary color for buttons, links, and accents</small>
                                </div>
                                <div className="col-md-4">
                                    <small className="text-muted">Secondary color for secondary elements</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Settings */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>Footer Settings</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        className="form-control"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Enter store address"
                                        rows="3"
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        placeholder="Enter WhatsApp number (e.g., +1234567890)"
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Brand Logo</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            setBrandLogo(file);
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (e) => setBrandLogoPreview(e.target.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    {brandLogoPreview && (
                                        <div className="mt-2">
                                            <img src={brandLogoPreview} alt="Brand Logo Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Social Media Links */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>Social Media Links</h5>
                        </div>
                        <div className="card-body">
                            {socialLinks.map((link, index) => (
                                <div key={index} className="mb-3 border-bottom pb-3">
                                    <div className="row">
                                        <div className="col-md-3 mb-2">
                                            <label className="form-label">Platform</label>
                                            <select
                                                className="form-select"
                                                value={link.icon}
                                                onChange={(e) => {
                                                    const updated = [...socialLinks];
                                                    updated[index].icon = e.target.value;
                                                    const selected = socialIconOptions.find(opt => opt.icon === e.target.value);
                                                    if (selected) updated[index].name = selected.name;
                                                    setSocialLinks(updated);
                                                }}
                                            >
                                                {socialIconOptions.map(opt => (
                                                    <option key={opt.icon} value={opt.icon}>{opt.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-7 mb-2">
                                            <label className="form-label">URL</label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                value={link.url}
                                                onChange={(e) => {
                                                    const updated = [...socialLinks];
                                                    updated[index].url = e.target.value;
                                                    setSocialLinks(updated);
                                                }}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="col-md-2 mb-2 d-flex align-items-end">
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => {
                                                    const updated = socialLinks.filter((_, i) => i !== index);
                                                    setSocialLinks(updated);
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => setSocialLinks([...socialLinks, { name: '', url: '', icon: 'fab fa-facebook' }])}
                            >
                                Add Social Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Facebook Pixel */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>Facebook Pixel</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Facebook Pixel ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={facebookPixelId}
                                    onChange={(e) => setFacebookPixelId(e.target.value)}
                                    placeholder="Enter your Facebook Pixel ID (e.g., 123456789012345)"
                                />
                                <small className="text-muted">Enter your Facebook Pixel ID to enable tracking. Leave empty to disable.</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product List Pagination */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>Product List Pagination</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Pagination Type</label>
                                <select
                                    className="form-select"
                                    value={productListPagination}
                                    onChange={(e) => setProductListPagination(e.target.value)}
                                >
                                    <option value="numbered">Numbered Pagination</option>
                                    <option value="infinite">Infinite Scroll</option>
                                </select>
                                <small className="text-muted">
                                    Choose how products are displayed on product list pages. Numbered pagination shows page numbers, infinite scroll loads more products as users scroll.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="row">
                {/* Currency Settings */}
                <div className="col-md-6 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <h5>Currency Settings</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Select Currency</label>
                                <select
                                    className="form-select"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="BDT">BDT (৳)</option>
                                    <option value="INR">INR (₹)</option>
                                </select>
                            </div>
                            <p className="text-muted">
                                <small>Current currency: <strong>{currency}</strong></small>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Methods moved to separate Admin page */}
            </div>


            {/* Info */}
            <div className="alert alert-info">
                <h5>Settings Information</h5>
                <ul>
                    <li><strong>Brand Name:</strong> The name displayed in the site header and throughout the application</li>
                    <li><strong>Primary Color:</strong> Main theme color used for buttons, links, and primary UI elements</li>
                    <li><strong>Secondary Color:</strong> Secondary theme color for supporting UI elements</li>
                    <li><strong>Currency:</strong> The selected currency will be used throughout the store for price display</li>
                    <li><strong>Payment Methods:</strong> Enable or disable payment methods that customers can use during checkout</li>
                    <li><strong>Address:</strong> Store address displayed in the footer</li>
                    <li><strong>WhatsApp Number:</strong> WhatsApp contact number displayed in the footer</li>
                    <li><strong>Brand Logo:</strong> Logo image displayed in the footer</li>
                    <li>Changes are saved to the database and will be applied across the entire store</li>
                </ul>
            </div>
        </>
    );
}

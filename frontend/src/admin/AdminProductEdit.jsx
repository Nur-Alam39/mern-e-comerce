import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../utils/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AdminSidebar from './AdminSidebar';

export default function AdminProductEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', description: '', price: 0, stock: 0, category: '', featured: false, newArrival: false, bestSelling: false, active: true, discountedPrice: 0 });
    const [files, setFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]); // server-side image URLs
    const [filePreviews, setFilePreviews] = useState([]); // object URLs for newly added files
    const fileInputRef = useRef(null);
    const [variations, setVariations] = useState([]);
    const quillRef = useRef(null);

    const fetchCategories = async () => {
        try { const res = await axios.get('/api/categories'); setCategories(Array.isArray(res.data) ? res.data : []); } catch (err) { console.log(err); }
    };

    const fetchProduct = async (productId) => {
        try {
            const res = await axios.get('/api/products/' + productId);
            const p = res.data;
            setForm({
                name: p.name || '',
                description: p.description || '',
                price: p.price || 0,
                stock: p.stock || 0,
                category: p.category ? (p.category._id || p.category) : '',
                featured: !!p.featured,
                newArrival: !!p.newArrival,
                bestSelling: !!p.bestSelling,
                active: p.active === undefined ? true : !!p.active,
                discountedPrice: p.discountedPrice || 0
            });
            setExistingImages(Array.isArray(p.images) ? p.images : []);
        } catch (err) { console.log('Load product failed', err); }
    };

    const fetchVariations = async (productId) => {
        try {
            const res = await axios.get('/api/variations/' + productId);
            setVariations(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.log('Load variations failed', err); }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            await fetchCategories();
            if (id) {
                await fetchProduct(id);
                await fetchVariations(id);
            }
            if (mounted) setLoading(false);
        })();
        return () => { mounted = false; };
    }, [id]);

    // cleanup object URLs for previews
    useEffect(() => {
        return () => {
            filePreviews.forEach(u => {
                try { URL.revokeObjectURL(u); } catch (e) { }
            });
        };
    }, [filePreviews]);

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (!newFiles.length) return;
        setFiles(prev => [...prev, ...newFiles]);
        const previews = newFiles.map(f => URL.createObjectURL(f));
        setFilePreviews(prev => [...prev, ...previews]);
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('description', form.description);
            fd.append('price', String(form.price));
            fd.append('stock', String(form.stock));
            if (form.category) fd.append('category', form.category);
            fd.append('featured', String(form.featured));
            fd.append('newArrival', String(form.newArrival));
            fd.append('bestSelling', String(form.bestSelling));
            fd.append('active', String(form.active));
            fd.append('discountedPrice', String(form.discountedPrice || 0));
            // send existing images for merging
            fd.append('existingImages', JSON.stringify(existingImages));
            files.forEach(f => fd.append('images', f));

            if (id) {
                await axios.put('/api/products/' + id, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await axios.post('/api/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            navigate('/admin?section=products');
        } catch (err) { console.log('Save failed', err); alert('Save failed'); }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <div className="row">
                <div className="col-md-3 mb-3">
                    <AdminSidebar active="products" onChange={(s) => navigate(`/admin?section=${s}`)} />
                </div>
                <div className="col-md-9">
                    <div className="mb-3">
                        <button className="btn btn-link p-0" onClick={() => navigate('/admin?section=products')} style={{ textDecoration: 'none' }}>
                            <i className="fa-solid fa-arrow-left me-2"></i>Back to Products
                        </button>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3>{id ? 'Edit Product' : 'Create Product'}</h3>
                        {id && (
                            <span className={`badge ${form.active ? 'bg-success' : 'bg-danger'}`}>
                                {form.active ? 'Active' : 'Inactive'}
                            </span>
                        )}
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-2">
                                            <label className="form-label">Name</label>
                                            <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label">Description</label>
                                            <ReactQuill ref={quillRef} theme="snow" value={form.description} onChange={value => setForm({ ...form, description: value })} />
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label">Category</label>
                                            <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                                <option value="">-- None --</option>
                                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                        </div>

                                        {variations.length > 0 && (
                                            <div className="mt-4">
                                                <b>Variations ({ variations.length })</b>
                                                <ul className="list-group">
                                                    {variations.map((v, idx) => (
                                                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                            <span>Size: {v.size}, Stock: {v.stock}, Price: ${v.price}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {id && (
                                            <button type="button" className="btn btn-info my-2" onClick={() => navigate(`/admin/products/${id}/variations`)}>Manage Variations</button>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-2">
                                            <label className="form-label">Price</label>
                                            <input type="number" step="0.01" className="form-control" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} required />
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label">Stock</label>
                                            <input type="number" className="form-control" value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label">Images</label>
                                            <input ref={fileInputRef} style={{ display: 'none' }} type="file" multiple className="form-control" onChange={handleFileChange} />
                                            <div className="d-flex flex-wrap gap-2">
                                                {/* existing server images */}
                                                {existingImages.map((img, idx) => (
                                                    <div key={`ex-${idx}`} className="position-relative" style={{ width: 96, height: 96, border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
                                                        <img alt={`img-${idx}`} src={img && img.startsWith('http') ? img : (axios.defaults.baseURL + img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <div className="position-absolute" style={{ right: 6, top: 6, color: '#fff', cursor: 'pointer' }} title="Edit image">
                                                            <i className="fa-solid fa-pencil" onClick={triggerFileInput}></i>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* newly selected file previews */}
                                                {filePreviews.map((p, i) => (
                                                    <div key={`new-${i}`} className="position-relative" style={{ width: 96, height: 96, border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
                                                        <img alt={`new-${i}`} src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <div className="position-absolute" style={{ right: 6, top: 6, color: '#fff' }}>
                                                            <i className="fa-solid fa-pencil"></i>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* add box */}
                                                <div onClick={triggerFileInput} className="d-flex align-items-center justify-content-center" style={{ width: 96, height: 96, border: '1px dashed #bbb', borderRadius: 6, cursor: 'pointer' }} title="Add images">
                                                    <div className="text-center">
                                                        <div style={{ fontSize: 20 }}><i className="fa-solid fa-plus"></i></div>
                                                        <div className="small">Add</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="small mt-1">Selected: {files.map(f => f.name).join(', ')}</div>
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label">Discounted Price</label>
                                            <input type="number" step="0.01" className="form-control" value={form.discountedPrice} onChange={e => setForm({ ...form, discountedPrice: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div className="mb-2 form-check">
                                            <input id="active" className="form-check-input" type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                                            <label className="form-check-label" htmlFor="active">Active</label>
                                        </div>
                                        <div className="mb-2 form-check">
                                            <input id="featured" className="form-check-input" type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                                            <label className="form-check-label" htmlFor="featured">Featured</label>
                                        </div>
                                        <div className="mb-2 form-check">
                                            <input id="newArrival" className="form-check-input" type="checkbox" checked={form.newArrival} onChange={e => setForm({ ...form, newArrival: e.target.checked })} />
                                            <label className="form-check-label" htmlFor="newArrival">New Arrival</label>
                                        </div>
                                        <div className="mb-2 form-check">
                                            <input id="bestSelling" className="form-check-input" type="checkbox" checked={form.bestSelling} onChange={e => setForm({ ...form, bestSelling: e.target.checked })} />
                                            <label className="form-check-label" htmlFor="bestSelling">Best Selling</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-right">
                                    <button className="btn btn-primary" type="submit">Save</button>
                                    <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/admin?section=products')}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
    </div>
    );
}

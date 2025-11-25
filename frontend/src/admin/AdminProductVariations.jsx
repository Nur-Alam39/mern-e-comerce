import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/api';

export default function AdminProductVariations() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [variations, setVariations] = useState([]);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ size: '', stock: '', price: '' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadData();
    }, [productId]);

    const loadData = async () => {
        try {
            const [prodRes, varRes] = await Promise.all([
                axios.get(`/api/products/${productId}`),
                axios.get(`/api/variations/${productId}`)
            ]);
            setProduct(prodRes.data);
            setVariations(Array.isArray(varRes.data) ? varRes.data : []);
        } catch (err) {
            console.error('Failed to load', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.size || !form.stock || !form.price) {
            alert('All fields required');
            return;
        }

        try {
            if (editingId) {
                await axios.put(`/api/variations/${editingId}`, {
                    size: form.size,
                    stock: parseInt(form.stock),
                    price: parseFloat(form.price)
                });
            } else {
                await axios.post(`/api/variations/${productId}`, {
                    size: form.size,
                    stock: parseInt(form.stock),
                    price: parseFloat(form.price)
                });
            }
            setForm({ size: '', stock: '', price: '' });
            setEditingId(null);
            await loadData();
        } catch (err) {
            console.error('Failed to save variation', err);
            alert('Failed to save variation');
        }
    };

    const handleEdit = (variation) => {
        setEditingId(variation._id);
        setForm({ size: variation.size, stock: variation.stock, price: variation.price });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this variation?')) return;
        try {
            await axios.delete(`/api/variations/${id}`);
            await loadData();
        } catch (err) {
            console.error('Failed to delete', err);
            alert('Delete failed');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm({ size: '', stock: '', price: '' });
    };

    if (loading) return <p>Loading...</p>;
    if (!product) return <p>Product not found</p>;

    return (
        <div className='container'>
            <button className="btn btn-light mb-3" onClick={() => navigate(`/admin/products/edit/${product._id}`)}>
              <i className='fa fa-chevron-left'></i> &nbsp; Back to Product
            </button>

            <h3 className="mb-4">Variations for: {product.name}</h3>

            <div className="row mb-4">
                <div className="col-md-5">
                    <div className="card">
                        <div className="card-body">
                            <h5>{editingId ? 'Edit Variation' : 'Add Variation'}</h5>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Size</label>
                                    <input
                                        className="form-control"
                                        value={form.size}
                                        onChange={e => setForm({ ...form, size: e.target.value })}
                                        placeholder="e.g., S, M, L, XL"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Stock</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.stock}
                                        onChange={e => setForm({ ...form, stock: e.target.value })}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Price</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.price}
                                        onChange={e => setForm({ ...form, price: e.target.value })}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100">
                                    {editingId ? 'Update' : 'Add'}
                                </button>
                                {editingId && (
                                    <button type="button" className="btn btn-secondary w-100 mt-2" onClick={handleCancel}>
                                        Cancel
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-md-7">
                    <div className="card">
                        <div className="card-body">
                            <h5>Variations List</h5>
                            {variations.length === 0 ? (
                                <p className="text-muted">No variations yet</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Size</th>
                                                <th>Stock</th>
                                                <th>Price</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variations.map(v => (
                                                <tr key={v._id}>
                                                    <td><strong>{v.size}</strong></td>
                                                    <td>{v.stock}</td>
                                                    <td>${v.price}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(v)}>Edit</button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(v._id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

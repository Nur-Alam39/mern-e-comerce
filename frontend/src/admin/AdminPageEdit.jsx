import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../utils/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AdminSidebar from './AdminSidebar';

export default function AdminPageEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        title: '',
        slug: '',
        content: '',
        active: true,
    });

    const quillRef = useRef(null);

    const fetchPage = async (pageId) => {
        try {
            const res = await axios.get(`/api/pages/${pageId}`);
            const p = res.data;

            setForm({
                title: p.title || '',
                slug: p.slug || '',
                content: p.content || '',
                active: !!p.active,
            });
        } catch (err) {
            console.error('Load page failed', err);
        }
    };

    useEffect(() => {
        let mounted = true;

        (async () => {
            setLoading(true);
            if (id) await fetchPage(id);
            if (mounted) setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [id]);

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        const slug = generateSlug(title);
        setForm({ ...form, title, slug });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (id) {
                await axios.put(`/api/pages/${id}`, form);
            } else {
                await axios.post('/api/pages', form);
            }
            navigate('/admin?section=pages');
        } catch (err) {
            console.error('Save failed', err);
            alert('Save failed');
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <div className="row">
                <div className="col-md-3 mb-3">
                    <AdminSidebar
                        active="pages"
                        onChange={(s) => navigate(`/admin?section=${s}`)}
                    />
                </div>

                <div className="col-md-9">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3>{id ? 'Edit Page' : 'Create Page'}</h3>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-2">
                                            <label className="form-label">Title</label>
                                            <input
                                                className="form-control"
                                                value={form.title}
                                                onChange={handleTitleChange}
                                                required
                                            />
                                        </div>

                                        <div className="mb-2">
                                            <label className="form-label">Slug</label>
                                            <input
                                                className="form-control"
                                                value={form.slug}
                                                onChange={(e) =>
                                                    setForm({ ...form, slug: e.target.value })
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="mb-2 form-check">
                                            <input
                                                id="active"
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={form.active}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        active: e.target.checked,
                                                    })
                                                }
                                            />
                                            <label className="form-check-label" htmlFor="active">
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div className="mb-2">
                                            <label className="form-label">Content</label>
                                            <ReactQuill
                                                ref={quillRef}
                                                theme="snow"
                                                value={form.content}
                                                onChange={(content) =>
                                                    setForm({ ...form, content })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <button className="btn btn-primary" type="submit">
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary ms-2"
                                        onClick={() =>
                                            navigate('/admin?section=pages')
                                        }
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../utils/api';

export default function Page() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/pages/slug/${slug}`);
        setPage(res.data);
        setError(null);
      } catch (err) {
        console.log('Failed to load page', err);
        setError('Page not found');
        setPage(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <h2>Page Not Found</h2>
          <p>The page you're looking for doesn't exist or is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h1 className="mb-4">{page.title}</h1>
          <div
            className="page-content"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/api';
import './footer.css';
import { useSettings } from '../hooks/useSettings';

export default function Footer() {
  const [pages, setPages] = useState([]);
  const { brandName, socialLinks, address, whatsapp, brandLogo, paymentMethods } = useSettings();

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${axios.defaults.baseURL}${imagePath}`;
  };

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await axios.get('/api/pages');
        const activePages = Array.isArray(res.data) ? res.data.filter(p => p.active) : [];
        setPages(activePages);
      } catch (err) {
        console.log('Failed to load pages', err);
      }
    };
    fetchPages();
  }, []);

  const activePaymentMethods = paymentMethods.filter(m => m.enabled);

  return (
    <footer className="site-footer">
      <div className="container text-start">
        <div className="row">
          <div className="col-md-4 mb-3">
            {brandLogo && (
              <div className="mb-3">
                <img src={getImageUrl(brandLogo)} alt="Brand Logo" style={{ maxWidth: '150px', maxHeight: '50px' }} />
              </div>
            )}
            {address && (
              <div className="mb-3">
                <h6>Address</h6>
                <p className="small">{address}</p>
              </div>
            )}
            {whatsapp && (
              <div className="mb-3">
                <h6>Contact</h6>
                <p className="small">
                  <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    WhatsApp: {whatsapp}
                  </a>
                </p>
              </div>
            )}
          </div>
          <div className="col-md-4 mb-3">
            <h6>Quick Links</h6>
            <div className="footer-links justify-content-start" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {pages.map(page => (
                <Link key={page._id} to={`/page/${page.slug}`} className="footer-link d-block mb-1 text-left">
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="col-md-4 mb-3">
            {socialLinks.length > 0 && (
              <div className="mb-3">
                <h6>Follow Us</h6>
                <div className="social-links">
                  {socialLinks.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="social-link me-3">
                      <i className={link.icon}></i>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {activePaymentMethods.length > 0 && (
              <div className="mb-3">
                <h6>Payment Methods</h6>
                <div className="d-flex flex-wrap justify-content-start align-items-center">
                  {activePaymentMethods.map(m => (
                    <div key={m.name} style={{ marginRight: '10px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                      {m.logo ? (
                        <img src={getImageUrl(m.logo)} alt={m.name} style={{ height: '25px' }} />
                      ) : (
                        <div style={{
                          height: '25px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#6c757d'
                        }}>
                          {m.name.toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* <hr /> */}
         <div className='text-center'>
           <p className="mb-1 small text-secondary">Copyright © {new Date().getFullYear()} {brandName}</p>
           <p className="small mb-0"></p>
         </div>
      </div>
    </footer>
  );
}

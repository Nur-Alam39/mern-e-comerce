import React, { useEffect, useState, useRef } from 'react';
import axios from '../utils/api';
import './hero.css';

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/sliders');
        const data = res && res.data ? res.data : [];
        setSlides(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log('Failed to load sliders', err && err.message ? err.message : err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [slides]);

  const prev = () => {
    setIndex(i => (i - 1 + slides.length) % slides.length);
    resetTimer();
  };
  const next = () => {
    setIndex(i => (i + 1) % slides.length);
    resetTimer();
  };
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setIndex(i => (i + 1) % slides.length);
      }, 5000);
    }
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="hero-placeholder">
        <div className="container">
          <h2>Welcome to our store</h2>
          <p>Manage hero slides from the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-slider">
      {slides.map((s, i) => {
        let img = '/placeholder.png';
        if (s.image) {
          // If image is a full URL, use it directly
          if (s.image.startsWith('http')) {
            img = s.image;
          } else if (s.image.startsWith('/')) {
            // If it's a path starting with /, prepend the API base URL
            const baseURL = axios.defaults.baseURL || 'http://localhost:5000';
            img = baseURL + s.image;
          } else {
            // Otherwise treat it as a relative path
            img = s.image;
          }
        }
        const visible = i === index ? 'visible' : '';
        return (
          <div key={i} className={`hero-slide ${visible}`} style={{ backgroundImage: `url(${img})` }}>
            <div className="hero-overlay">
              <div className="hero-content container">
                <h2>{s.title}</h2>
                {s.subtitle && <p>{s.subtitle}</p>}
                {s.ctaText && s.ctaLink && (
                  <a className="btn btn-primary" href={s.ctaLink}>{s.ctaText}</a>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <button className="hero-prev" onClick={prev} aria-label="Previous">‹</button>
      <button className="hero-next" onClick={next} aria-label="Next">›</button>
    </div>
  );
}

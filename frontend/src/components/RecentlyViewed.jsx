import React, { useEffect, useState } from 'react';
import axios from '../utils/api';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../hooks/useSettings';
import Toast from './Toast';
import ProductCard from './ProductCard';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './products.css';

export default function RecentlyViewed({ currentId, limit = 10 }) {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(null);
  const { addToCart } = useCart();
  const { formatPrice } = useSettings();

  const NextArrow = ({ onClick }) => {
    return (
      <button className="slick-next-btn" onClick={onClick}>
        <span><i className="fa fa-chevron-right"></i></span>
      </button>
    );
  };

  const PrevArrow = ({ onClick }) => {
    return (
      <button className="slick-prev-btn" onClick={onClick}>
        <span><i className="fa fa-chevron-left"></i></span>
      </button>
    );
  };

  const settings = {
    dots: true,
    arrows: true,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    centerPadding: '0px',
    swipe: false,
    draggable: false,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    dotsClass: "custom-slick-dots",
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 2,
        }
      }
    ]
  };

  useEffect(() => {
    const load = async () => {
      try {
        const raw = localStorage.getItem('recentlyViewed');
        let ids = [];
        try { ids = raw ? JSON.parse(raw) : []; } catch (e) { ids = []; }
        // Exclude current product
        ids = ids.filter(i => String(i) !== String(currentSlug));
        if (ids.length === 0) return setItems([]);
        const take = ids.slice(0, limit);
        const proms = take.map(id => axios.get(`/api/products/${id}`).then(r => r.data).catch(() => null));
        const results = await Promise.all(proms);
        const products = results.filter(Boolean);
        setItems(products);
      } catch (err) {
        console.log('Failed to load recently viewed', err && err.message ? err.message : err);
      }
    };
    load();
  }, [currentSlug, limit]);


  if (!items || items.length === 0) return null;

  return (
    <section className="py-5">
      <h3 className="mb-3 mt-5 fw-bold">Recently Viewed</h3>
      <div className={items.length < 4 ? "few-items" : ""}>
        <Slider {...settings}>
          {items.map(p => (
            <div key={p._id} className="px-2">
              <ProductCard product={p} className="" />
            </div>
          ))}
        </Slider>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </section>
  );
}

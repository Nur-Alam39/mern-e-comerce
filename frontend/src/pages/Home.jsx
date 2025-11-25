import React from 'react';
import HeroSlider from '../components/HeroSlider';
import MainCategories from '../components/MainCategories';
import FeaturesSection from '../components/FeaturesSection';
import FeaturedProducts from '../components/FeaturedProducts';
import NewArrivals from '../components/NewArrivals';
import Footer from '../components/Footer';
import '../styles/home.css';

export default function Home() {
  return (
    <div>
      <HeroSlider />
      <MainCategories />
      <FeaturedProducts limit={4} />
      <NewArrivals limit={4} />
      <FeaturesSection />
      <Footer />
    </div>
  );
}

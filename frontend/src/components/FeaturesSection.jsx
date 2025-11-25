import React from 'react';

export default function FeaturesSection() {
  const features = [
    {
      icon: 'fas fa-credit-card',
      title: 'Easy Checkout',
      description: 'Secure and fast checkout process with multiple payment options'
    },
    {
      icon: 'fas fa-truck',
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery to your doorstep within 24-48 hours'
    },
    {
      icon: 'fas fa-undo',
      title: 'Easy Returns',
      description: 'Hassle-free returns within 30 days of purchase'
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Secure Payment',
      description: 'Your payment information is protected with bank-level security'
    },
    {
      icon: 'fas fa-headset',
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your queries'
    },
    {
      icon: 'fas fa-tags',
      title: 'Best Prices',
      description: 'Competitive pricing with regular discounts and offers'
    }
  ];

  return (
    <section className="features-section py-5">
      <div className="container">
        <div className="row">
          <div className="col-12 text-center mb-4">
            <h3>Why Choose Us</h3>
            <p className="section-subtitle text-muted">Experience the best in online shopping</p>
          </div>
        </div>
        <div className="row g-4">
          {features.map((feature, index) => (
            <div key={index} className="col-lg-4 col-md-6">
              <div className="feature-card text-center p-2 h-100">
                <div className="feature-icon mb-3">
                  <i className={`${feature.icon} fa-2x text-dark`}></i>
                </div>
                <h6 className="feature-title mb-3">{feature.title}</h6>
                <p className="feature-description text-muted mb-0">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import './Features.css';

const FeatureItem = ({ number, title, description }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => setVisible(entry.isIntersecting));
    });

    const currentElement = domRef.current;
    if (currentElement instanceof Element) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement instanceof Element) {
        observer.unobserve(currentElement);
      }
    };
  }, []);

  return (
    <div className={`feature-item ${isVisible ? 'is-visible' : ''}`} ref={domRef}>
      <div className="feature-number">{number}</div>
      <div className="feature-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

const Features = () => {
  return (
    <section className="features-timeline">
      <FeatureItem 
        number="01"
        title="Multilingual Translation"
        description="Translate documents into over 50 of the most commonly used languages"
      />
      <FeatureItem 
        number="02"
        title="Document Insights"
        description="Extract document insights to ensure proper translation and increase comprehension"
      />
      <FeatureItem 
        number="03"
        title="Security Management"
        description="Manage the security of your sensitive documents"
      />
    </section>
  );
};

export default Features;

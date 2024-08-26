import React, { useEffect, useRef, useState } from 'react';
import './Pricing.css';

const ScaleInSection = ({ children }) => {
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
    <div className={`scale-in-section ${isVisible ? 'is-visible' : ''}`} ref={domRef}>
      {children}
    </div>
  );
};

const Pricing = () => {
  return (
    <ScaleInSection>
      <section className="pricing">
        <div className="pricing-box">
          <h3 className="pricing-title">Submission</h3>
          <div className="pricing-feature">Secured Frontend from any malicious attacks</div>
        </div>
        <div className="pricing-box featured">
          <h3 className="pricing-title">Response</h3>
          <div className="pricing-feature">Reliable Backend with protected APIs</div>
        </div>
        <div className="pricing-box">
          <h3 className="pricing-title">Storage</h3>
          <div className="pricing-feature">Automatic deletion of documents held for a month</div>
        </div>
      </section>
    </ScaleInSection>
  );
};

export default Pricing;

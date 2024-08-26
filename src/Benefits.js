import React, { useEffect, useRef, useState } from 'react';
import './Benefits.css';

const FadeInSection = ({ children }) => {
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
    <div className={`fade-in-section ${isVisible ? 'is-visible' : ''}`} ref={domRef}>
      {children}
    </div>
  );
};

const Benefits = () => {
  return (
    <FadeInSection>
      <section className="benefits">
        <div className="benefit-box">
          <span className="benefit-number">1</span>
          <div className="benefit-text">Expedite interactions with clients, translations that used to take days and weeks now are done in a matter of minutes</div>
        </div>
        <div className="benefit-box">
          <span className="benefit-number">2</span>
          <div className="benefit-text">Save money hiring your AI assistant instead of costly employees and 3rd party companies</div>
        </div>
        <div className="benefit-box">
          <span className="benefit-number">3</span>
          <div className="benefit-text">Get professional quality translations from bleeding-edge LLMs specifically trained on industry-standard legal documents</div>
        </div>
      </section>
    </FadeInSection>
  );
};

export default Benefits;

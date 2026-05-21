import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Workflow from './components/Workflow';
import DemoPlayground from './components/DemoPlayground';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

export default function App() {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Premium Hash Auto-scroll Utility on Initial Load (e.g. from static subpages back to homepage anchor)
  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      // Wait briefly for all components to be fully laid out in the DOM
      const timer = setTimeout(() => {
        scrollToSection(targetId);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Navbar scrollToSection={scrollToSection} />

      <main className="fade-in">
        <Hero scrollToSection={scrollToSection} />
        
        <Features />
        
        <Workflow />
        
        <DemoPlayground />
        
        <Pricing />
        
        <FAQ />

        {/* Dynamic Bottom CTA Banner */}
        <section className="footer-cta" id="bottom-cta">
          <div className="container">
            <div className="footer-cta-card glass-card">
              <h2>Scale Your WhatsApp Reach Today</h2>
              <p>
                Join over 12,000+ modern teams using Growbychat to manage auto-responders, run high-converting broadcasts, and power reliable OTP verifications.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button className="btn btn-primary" onClick={() => scrollToSection('pricing')}>
                  Get Started Instantly
                </button>
                <button className="btn btn-secondary" onClick={() => scrollToSection('playground')}>
                  Test Live Sandbox
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer scrollToSection={scrollToSection} />
    </>
  );
}

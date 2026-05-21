import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Workflow from './components/Workflow';
import DemoPlayground from './components/DemoPlayground';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import Footer from './components/Footer';

export default function App() {
  const [page, setPage] = useState('home'); // home, privacy, terms

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Navbar page={page} setPage={setPage} scrollToSection={scrollToSection} />

      {page === 'home' && (
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
      )}

      {page === 'privacy' && (
        <Privacy setPage={setPage} />
      )}

      {page === 'terms' && (
        <Terms setPage={setPage} />
      )}

      <Footer setPage={setPage} scrollToSection={scrollToSection} />
    </>
  );
}

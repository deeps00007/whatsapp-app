import React, { useState, useEffect } from 'react';

export default function Navbar({ page, setPage, scrollToSection }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    if (page !== 'home') {
      setPage('home');
      // Delay scrolling slightly to let the home page mount
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
    } else {
      scrollToSection(sectionId);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); setPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span>Growbychat</span>
          <div className="logo-dot"></div>
        </a>

        <ul className="nav-menu">
          <li>
            <a href="#features" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('features'); }}>
              Features
            </a>
          </li>
          <li>
            <a href="#workflow" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('workflow'); }}>
              How It Works
            </a>
          </li>
          <li>
            <a href="#playground" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('playground'); }}>
              Live Playground
            </a>
          </li>
          <li>
            <a href="#pricing" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('pricing'); }}>
              Pricing
            </a>
          </li>
          <li>
            <a href="#faq" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('faq'); }}>
              FAQ
            </a>
          </li>
        </ul>

        <div className="nav-cta">
          <a href="#pricing" className="btn btn-secondary nav-link" style={{ padding: '8px 16px', borderRadius: '8px' }} onClick={(e) => { e.preventDefault(); handleNavClick('pricing'); }}>
            Login
          </a>
          <a href="#pricing" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }} onClick={(e) => { e.preventDefault(); handleNavClick('pricing'); }}>
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}

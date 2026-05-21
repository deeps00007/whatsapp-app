import React from 'react';

export default function Footer({ setPage, scrollToSection }) {
  const handleLinkClick = (e, sectionId) => {
    e.preventDefault();
    setPage('home');
    setTimeout(() => {
      scrollToSection(sectionId);
    }, 100);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); setPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span>Growbychat</span>
              <div className="logo-dot"></div>
            </a>
            <p style={{ color: 'var(--text-secondary)' }}>
              Supercharging customer communication with modern WhatsApp broadcasts, APIs, and no-code automation workflows. Simple, fast, and secure.
            </p>
          </div>

          <div className="footer-links-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features" onClick={(e) => handleLinkClick(e, 'features')}>Features</a></li>
              <li><a href="#workflow" onClick={(e) => handleLinkClick(e, 'workflow')}>How It Works</a></li>
              <li><a href="#playground" onClick={(e) => handleLinkClick(e, 'playground')}>Live Playground</a></li>
              <li><a href="#pricing" onClick={(e) => handleLinkClick(e, 'pricing')}>Pricing Plans</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Integrations</h4>
            <ul>
              <li><a href="#playground" onClick={(e) => handleLinkClick(e, 'playground')}>REST API Devs</a></li>
              <li><a href="#home" onClick={(e) => handleLinkClick(e, 'home')}>Facebook Sign-In</a></li>
              <li><a href="#home" onClick={(e) => handleLinkClick(e, 'home')}>WhatsApp QR Web</a></li>
              <li><a href="#faq" onClick={(e) => handleLinkClick(e, 'faq')}>Active Webhooks</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#faq" onClick={(e) => handleLinkClick(e, 'faq')}>FAQ Help Desk</a></li>
              <li>
                <a href="#privacy" onClick={(e) => { e.preventDefault(); setPage('privacy'); }}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" onClick={(e) => { e.preventDefault(); setPage('terms'); }}>
                  Terms of Service
                </a>
              </li>
              <li><a href="#home" onClick={(e) => handleLinkClick(e, 'home')}>Corporate Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div style={{ color: 'var(--text-secondary)' }}>
            &copy; {new Date().getFullYear()} Growbychat Inc. All rights reserved.
          </div>
          <div className="footer-legal-links">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); setPage('privacy'); }}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => { e.preventDefault(); setPage('terms'); }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

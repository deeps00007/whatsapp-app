import React, { useState, useEffect } from 'react';

export default function Hero({ scrollToSection }) {
  const [activeStep, setActiveStep] = useState(1);
  const [phoneMessages, setPhoneMessages] = useState([
    { id: 1, text: "Hey! Can I use my old WhatsApp business number with your SaaS?", incoming: true, time: "10:42 AM" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Auto animation sequence for the wizard dashboard
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev === 3 ? 1 : prev + 1;
        triggerPhoneAction(next);
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const triggerPhoneAction = (step) => {
    if (step === 1) {
      setPhoneMessages([
        { id: 1, text: "Hey! Can I use my old WhatsApp business number with your SaaS?", incoming: true, time: "10:42 AM" }
      ]);
    } else if (step === 2) {
      setPhoneMessages([
        { id: 1, text: "Hey! Can I use my old WhatsApp business number with your SaaS?", incoming: true, time: "10:42 AM" },
        { id: 2, text: "Absolutely! Just log in via Facebook and authorize your page in one click. No developer accounts needed.", incoming: false, time: "10:42 AM" }
      ]);
    } else if (step === 3) {
      setPhoneMessages([
        { id: 1, text: "Hey! Can I use my old WhatsApp business number with your SaaS?", incoming: true, time: "10:42 AM" },
        { id: 2, text: "Absolutely! Just log in via Facebook and authorize your page in one click. No developer accounts needed.", incoming: false, time: "10:42 AM" },
        { id: 3, text: "Wow, that was instant! My automation is already running 🚀", incoming: true, time: "10:43 AM" }
      ]);
    }
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
    triggerPhoneAction(step);
  };

  return (
    <header className="hero" id="home">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      <div className="grid-overlay"></div>

      <div className="container">
        <div className="hero-content fade-in">
          <div className="accent-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            No Meta Cloud API Setup Required
          </div>
          <h1>
            Automate WhatsApp in <span className="gradient-green-text">Under 2 Minutes</span>
          </h1>
          <p>
            The easiest WhatsApp SaaS on the market. Skip the complex Meta developer setups, custom tokens, and billing configuration. Just log in with your Facebook account, connect your existing business number, and instantly scale broadcasts, run automated chats, and trigger high-speed OTP services.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => scrollToSection('pricing')}>
              Start Free Trial
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button className="btn btn-secondary" onClick={() => scrollToSection('playground')}>
              Try Interactive Demo
            </button>
          </div>
        </div>

        <div className="hero-mockup-wrapper fade-in">
          <div className="hero-mockup">
            {/* Interactive Control Dashboard Panel */}
            <div className="dash-panel">
              <div className="dash-header">
                <div className="dash-title">
                  <span>Connection Console</span>
                  <span className="dash-badge">Real-time Sandbox</span>
                </div>
              </div>

              <div className="dash-steps">
                <div 
                  className={`dash-step-item ${activeStep === 1 ? 'active' : ''}`}
                  onClick={() => handleStepClick(1)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dash-step-num">1</div>
                  <div className="dash-step-content">
                    <h4>Connect Facebook Account</h4>
                    <p>Standard secure OAuth. No developer panel or custom app configs needed.</p>
                  </div>
                </div>

                <div 
                  className={`dash-step-item ${activeStep === 2 ? 'active' : ''}`}
                  onClick={() => handleStepClick(2)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dash-step-num">2</div>
                  <div className="dash-step-content">
                    <h4>Scan QR or Link Existing Number</h4>
                    <p>Direct WhatsApp Web mapping or Facebook Page pairing in seconds.</p>
                  </div>
                </div>

                <div 
                  className={`dash-step-item ${activeStep === 3 ? 'active' : ''}`}
                  onClick={() => handleStepClick(3)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dash-step-num">3</div>
                  <div className="dash-step-content">
                    <h4>Dive into Automation</h4>
                    <p>Send OTPs, auto-respond, launch broadcasts to infinite users instantly.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Virtual Phone Viewport */}
            <div className="virtual-phone">
              <div className="phone-header">
                <div className="phone-avatar">S</div>
                <div className="phone-user-info">
                  <h5>SwiftFlow Auto-Bot</h5>
                  <span>Active & Connected</span>
                </div>
              </div>

              <div className="phone-body">
                {phoneMessages.map((msg) => (
                  <div key={msg.id} className={`msg ${msg.incoming ? 'msg-incoming' : 'msg-outgoing'}`}>
                    <div>{msg.text}</div>
                    <div className="msg-time">{msg.time}</div>
                  </div>
                ))}
                {isTyping && (
                  <div className="msg msg-incoming" style={{ opacity: 0.7, fontStyle: 'italic', padding: '6px 12px' }}>
                    typing...
                  </div>
                )}
              </div>

              <div className="phone-footer">
                <input 
                  type="text" 
                  className="phone-input" 
                  placeholder="Demo automated response..." 
                  disabled
                />
                <button className="phone-send" disabled>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

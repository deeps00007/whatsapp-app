import React, { useEffect, useState } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Workflow from './components/Workflow';
import DemoPlayground from './components/DemoPlayground';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import DashboardWorkspace from './components/DashboardWorkspace';

const getBackendUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }
  return 'https://api.growbychat.app';
};
const backendUrl = getBackendUrl();

export default function App() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [connectedUser, setConnectedUser] = useState(() => localStorage.getItem('growbychat_user_id') || null);
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem('growbychat_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDisconnect = async (forcedUserId) => {
    const targetUserId = forcedUserId || connectedUser;
    if (!targetUserId) return;
    try {
      await fetch(`${backendUrl}/api/disconnect.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId })
      });
    } catch (_err) {
      // Silent fallback — cleanup continues regardless
    } finally {
      setConnectedUser(null);
      setProfileData(null);
      localStorage.removeItem('growbychat_user_id');
      localStorage.removeItem('growbychat_profile');
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const res = await fetch(`${backendUrl}/api/get_profile.php?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        localStorage.setItem('growbychat_profile', JSON.stringify(data));
      } else if (res.status === 404) {
        await handleDisconnect(userId);
      }
    } catch (_err) {
      // Silent fallback
    }
  };

  // Verify WABA session health on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('growbychat_user_id');
    if (savedUserId) {
      fetchProfile(savedUserId);
    }
  }, []);

  // Premium Hash Auto-scroll Utility & OAuth Callback Listener
  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash;
      if (hash.startsWith('#oauth=success')) {
        setShowSuccessModal(true);
        
        // Parse parameters from hash
        const hashQuery = hash.substring(hash.indexOf('success') + 7);
        const params = new URLSearchParams(hashQuery);
        const userId = params.get('user_id') || 'growbychat_user';
        
        setConnectedUser(userId);
        localStorage.setItem('growbychat_user_id', userId);
        fetchProfile(userId);

        // Silently clear hash from address bar to prevent popup on reload
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
      } else {
        const targetId = hash.substring(1);
        const timer = setTimeout(() => {
          scrollToSection(targetId);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <>
      <SpeedInsights />
      <Analytics />
      {profileData ? (
        <DashboardWorkspace 
          profileData={profileData} 
          onDisconnect={handleDisconnect} 
          onRefreshProfile={fetchProfile}
          backendUrl={backendUrl}
        />
      ) : (
        <>
          <Navbar scrollToSection={scrollToSection} connectedUser={connectedUser} onDisconnect={handleDisconnect} />

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
                      Test Live Demo
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <Footer scrollToSection={scrollToSection} />
        </>
      )}

      {/* Premium OAuth Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay fade-in" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(5, 8, 20, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-card fade-in" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '40px',
            textAlign: 'center',
            borderRadius: '24px',
            border: '1px solid rgba(0, 242, 126, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 242, 126, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient Background Glow inside Modal */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(0, 242, 126, 0.08) 0%, transparent 60%)',
              pointerEvents: 'none',
              zIndex: 0
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Rotating Verified Circle Grid */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 126, 0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto 24px auto',
                border: '1px solid rgba(0, 242, 126, 0.3)',
                boxShadow: '0 0 20px rgba(0, 242, 126, 0.2)'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00F27E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <div className="accent-badge" style={{ margin: '0 auto 12px auto', display: 'inline-block' }}>WhatsApp API Connected</div>
              <h3 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px', color: '#FFF', fontFamily: 'Outfit' }}>Integration Successful!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '28px' }}>
                Your Facebook page and WhatsApp Business profile have been successfully connected via Meta's secure login.
              </p>

              {/* Status parameters table */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginBottom: '32px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>Connection Status</span>
                  <span style={{ fontSize: '13px', color: '#00F27E', fontWeight: '600' }}>Active / Secure</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>Token Storage</span>
                  <span style={{ fontSize: '13px', color: '#00E5FF', fontWeight: '600' }}>Securely Encrypted</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>Webhook Status</span>
                  <span style={{ fontSize: '13px', color: '#7C3AED', fontWeight: '600' }}>Active</span>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px' }} onClick={() => setShowSuccessModal(false)}>
                Enter Business Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

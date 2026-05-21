import React, { useEffect } from 'react';

export default function Privacy({ setPage }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page container fade-in">
      <div className="legal-header">
        <div className="accent-badge">Privacy Policy</div>
        <h1>Privacy & Data Protection Policy</h1>
        <p>Last updated: May 21, 2026</p>
      </div>

      <div className="legal-card glass-card">
        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>
              At SwiftFlow (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), your privacy is our absolute priority. This Privacy Policy details how we collect, process, manage, and safeguard information when you use our WhatsApp SaaS platform, including dashboards, automation tools, and API environments.
            </p>
            <p>
              By accessing or using our services, you consent to the data collection and processing methods described in this policy.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>
              To provide our seamless integration, we collect specific details related to your account configuration and connection metrics:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Name, business email, contact details, and payment information supplied upon subscribing.</li>
              <li><strong>Meta Authorization Credentials:</strong> Secure, temporary authorization access tokens generated when you log in via Facebook. We do not store or see your Facebook passwords.</li>
              <li><strong>Message Transmission Logs:</strong> Status timestamps (sent, delivered, read) to populate your analytics panel. We do not read or record personal text communications unless stored as trigger configurations.</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Process Meta & WhatsApp Data</h2>
            <p>
              SwiftFlow bridges your workspace directly to the WhatsApp infrastructure via secure Facebook OAuth channels.
            </p>
            <ul>
              <li>Our integration utilizes direct Page tokens to manage chat events, bot replies, and broadcasts.</li>
              <li>Your customer lists and imported phone numbers are stored strictly within encrypted databanks and are never shared, leased, or sold to third-party marketing services.</li>
              <li>Message payload bodies are processed strictly in real-time to trigger configured automated chat events.</li>
            </ul>
          </section>

          <section>
            <h2>4. Information Security & Encryption</h2>
            <p>
              We enforce strict enterprise-grade security structures:
            </p>
            <ul>
              <li>All outgoing and incoming transactions are encrypted in transit using Transport Layer Security (TLS 1.3).</li>
              <li>Database configurations, customer records, and access tokens are secured at-rest using Advanced Encryption Standard (AES-256).</li>
              <li>OAuth tokens are automatically cycled and refreshed to mitigate unauthorized access attempts.</li>
            </ul>
          </section>

          <section>
            <h2>5. Your Rights & Access Controls</h2>
            <p>
              You maintain full jurisdiction over your business assets:
            </p>
            <ul>
              <li>You may request complete erasure of your workspace, including contact databases, messaging history logs, and subscription metadata.</li>
              <li>You can instantly revoke our Meta page authorization directly within your Facebook Account settings.</li>
              <li>You can request a complete archive download of all records stored inside your SwiftFlow dashboard at any time.</li>
            </ul>
          </section>

          <section>
            <h2>6. Revisions to This Policy</h2>
            <p>
              We may periodically revise this document to reflect changes in Meta guidelines or industry security requirements. We will notify you of any structural modifications via email or through an active banner on your system control dashboard.
            </p>
          </section>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button className="btn btn-primary" onClick={() => setPage('home')}>
              Back to Home Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

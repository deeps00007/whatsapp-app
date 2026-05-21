import React, { useEffect } from 'react';

export default function Terms({ setPage }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page container fade-in">
      <div className="legal-header">
        <div className="accent-badge">Terms of Service</div>
        <h1>Terms & Conditions</h1>
        <p>Last updated: May 21, 2026</p>
      </div>

      <div className="legal-card glass-card">
        <div className="legal-content">
          <section>
            <h2>1. Agreement to Terms</h2>
            <p>
              By creating an account, syncing your WhatsApp details, or using the API endpoints provided by SwiftFlow (&quot;the Service,&quot; &quot;we,&quot; &quot;our&quot;), you agree to enter a legally binding contract governed by these Terms &amp; Conditions.
            </p>
            <p>
              If you disagree with any segment of these clauses, you must immediately terminate use of our environments and revoke dashboard tokens.
            </p>
          </section>

          <section>
            <h2>2. Permitted Use & Account Obligations</h2>
            <p>
              To maintain system equilibrium, you agree to comply with the following user covenants:
            </p>
            <ul>
              <li>You must be at least 18 years of age or possess legal corporate standing to establish a SaaS subscription.</li>
              <li>You are entirely responsible for all interactions, messages, media files, and payloads dispatched from your linked WhatsApp numbers.</li>
              <li>You agree to safeguard your developer API secret keys and prevent credentials leakage to unverified channels.</li>
            </ul>
          </section>

          <section>
            <h2>3. Explicit Anti-Spam Policy</h2>
            <p>
              We operate a strict, zero-tolerance policy against spam, harassment, and unsolicited advertising broadcasts.
            </p>
            <ul>
              <li>You are forbidden from importing contacts or blasting numbers that have not explicitly opted-in to receive updates from your brand.</li>
              <li>Outbound content must not promote scam programs, adult themes, illicit narcotics, hate speech, or financial frauds.</li>
              <li>If our systems detect excessive user block rates or message spam reports, we reserve the right to suspend or permanently block your workspace without a refund.</li>
            </ul>
          </section>

          <section>
            <h2>4. Subscriptions, Payments & Refunds</h2>
            <p>
              Terms governing subscription periods and transactions are detailed below:
            </p>
            <ul>
              <li><strong>Billing Recurrence:</strong> Plans automatically renew on your selected billing duration (monthly or annually) unless you submit a cancellation ticket prior to the renewal timestamp.</li>
              <li><strong>Payment Settlement:</strong> We process credit transactions using fully certified, secure merchant gateways. All charges are settled in US Dollars (USD).</li>
              <li><strong>Refund Clause:</strong> Subscriptions feature a risk-free 7-day money-back guarantee. Refund requests submitted after 7 days from the initial payment stamp are processed at our sole discretion.</li>
            </ul>
          </section>

          <section>
            <h2>5. Service Adjustments & Liability Boundaries</h2>
            <p>
              SwiftFlow acts as a bridging layer to the Meta WhatsApp network.
            </p>
            <ul>
              <li>We are not responsible for account bans, delivery delays, or channel blockages initiated directly by Meta, WhatsApp, or carrier entities.</li>
              <li>We make no warranties, explicit or implied, that the Service will remain completely error-free or operate with 100% uninterrupted uptime, though we strive for maximum service availability.</li>
              <li>In no event shall SwiftFlow be liable for lost profits, data erasure, or incidental damages arising from service usage or third-party modifications.</li>
            </ul>
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

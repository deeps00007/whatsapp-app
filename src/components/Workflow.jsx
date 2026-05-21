import React from 'react';

export default function Workflow() {
  const steps = [
    {
      num: "01",
      title: "Secure Facebook Login",
      description: "Click connect and log in with your standard Facebook credentials. We establish a secure Meta partner pipeline to find your registered pages instantly."
    },
    {
      num: "02",
      title: "Sync Your Existing Number",
      description: "No need for a brand new, empty phone number. Hook your active WhatsApp Business profile by scanning a direct, end-to-end encrypted dashboard QR code."
    },
    {
      num: "03",
      title: "Instantly Deploy at Scale",
      description: "Launch targeted marketing broadcasts, configure no-code chatbots to auto-respond to clients, or trigger instant OTP tokens using our developer API keys."
    }
  ];

  return (
    <section className="workflow-section" id="workflow">
      <div className="container">
        <div className="section-header">
          <div className="accent-badge">The 3-Step Setup</div>
          <h2>Forget the Meta API Headaches</h2>
          <p>Traditional WhatsApp platforms require developer approval, credit cards, complex authorization tokens, and API templates. Here is how Growbychat flips the script.</p>
        </div>

        <div className="flow-cards">
          {steps.map((step, idx) => (
            <div key={idx} className="flow-card glass-card">
              <span className="flow-num">{step.num}</span>
              <h3 style={{ fontSize: '20px', marginBottom: '12px', marginTop: '20px' }}>{step.title}</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

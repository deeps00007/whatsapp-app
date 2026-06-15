import React from 'react';

export default function Workflow() {
  const steps = [
    {
      num: "01",
      title: "Secure Facebook Login",
      description: "Connect using your official Facebook account. We establish a secure connection using Meta's Cloud API to link your WhatsApp Business profile instantly."
    },
    {
      num: "02",
      title: "Sync Phone & Templates",
      description: "Select your connected WhatsApp Business phone number and automatically import your pre-approved templates directly from your dashboard."
    },
    {
      num: "03",
      title: "Broadcast & Automate",
      description: "Launch targeted campaign broadcasts to your contacts, monitor delivery status receipts, or set up secure webhooks for real-time messaging updates."
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

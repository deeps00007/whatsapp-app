import React, { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "Can I use my existing active WhatsApp number?",
      a: "Yes, absolutely! Unlike standard APIs which force you to buy or map an empty, unused phone number, SwiftFlow lets you map your current WhatsApp or WhatsApp Business profile directly in seconds with zero loss of existing chats."
    },
    {
      q: "Do I need a Meta Developer account or custom billing mapping?",
      a: "No. You don't have to deal with the Facebook Developer portal, configuration files, system tokens, or complex setup dashboards. You simply authorize access via your standard Facebook Account, select your Page, and everything maps automatically."
    },
    {
      q: "How does the campaign queuing prevent spam bans?",
      a: "We have built-in smart throttle algorithms that distribute outbound broadcasts over soft, randomized intervals instead of blasting thousands of texts at the exact same millisecond. We also support tags to personalize every single message. Note: You should only message contacts who have consented to receive your communications."
    },
    {
      q: "Can I connect SwiftFlow to my custom website or backend app?",
      a: "Yes, we support comprehensive REST API hooks. Developers can trigger real-time transaction updates, shipping notifications, and high-priority OTP code verifications using simple JSON payloads in under 5 minutes."
    },
    {
      q: "Can multiple team members handle client messages simultaneously?",
      a: "Yes! Our Growth and Enterprise plans include dedicated seats for multiple agents. They can log in to a unified dashboard, see incoming messages, assign tasks, and tag customers using the single synced WhatsApp number."
    }
  ];

  const handleToggle = (index) => {
    setOpenIndex(prev => prev === index ? null : index);
  };

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="section-header">
          <div className="accent-badge">Common Questions</div>
          <h2>Frequently Asked Questions</h2>
          <p>Get answers to common onboarding, billing, and developer configuration inquiries regarding our WhatsApp SaaS environment.</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <div className="faq-header" onClick={() => handleToggle(idx)}>
                  <h3>{faq.q}</h3>
                  <span className="faq-icon">+</span>
                </div>
                <div 
                  className="faq-body"
                  style={{ 
                    maxHeight: isOpen ? '200px' : '0'
                  }}
                >
                  <div className="faq-content">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

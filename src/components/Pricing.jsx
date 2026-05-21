import React, { useState } from 'react';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // monthly or annual

  const plans = [
    {
      name: "Starter",
      description: "For small teams starting with WhatsApp automation.",
      price: {
        monthly: 29,
        annual: 19
      },
      features: [
        "1 Connected Number",
        "5,000 Broadcast Messages / mo",
        "3 Visual Chatbot Flows",
        "1 Dedicated Agent Seat",
        "Standard Rest API Keys",
        "Email Support (24h response)"
      ],
      popular: false
    },
    {
      name: "Growth",
      description: "Ideal for active brands scaling campaign outreach.",
      price: {
        monthly: 79,
        annual: 59
      },
      features: [
        "2 Connected Numbers",
        "Infinite Broadcast Messages",
        "Unlimited Chatbot Flows",
        "5 Dedicated Agent Seats",
        "High-Speed Priority API Gateway",
        "Advanced Analytics & Logs",
        "Priority Support (2h response)"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      description: "Custom configuration for massive scale.",
      price: {
        monthly: 199,
        annual: 149
      },
      features: [
        "Up to 5 Connected Numbers",
        "Infinite Broadcast Messages",
        "Unlimited Chatbot Flows",
        "Unlimited Agent Seats",
        "Dedicated API Server Port",
        "Whitelabel Custom Branding",
        "Dedicated Account Manager 24/7"
      ],
      popular: false
    }
  ];

  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className="section-header">
          <div className="accent-badge">Transparent Pricing</div>
          <h2>Select Your Launch Plan</h2>
          <p>Start scaling your customer communication instantly. Cancel, upgrade, or downgrade at any time with no lock-in contracts.</p>
        </div>

        <div className="pricing-toggle">
          <span className={`toggle-label ${billingPeriod === 'monthly' ? 'active' : ''}`} style={{ color: billingPeriod === 'monthly' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            Billed Monthly
          </span>
          <div 
            className={`toggle-switch ${billingPeriod === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'annual' : 'monthly')}
          ></div>
          <span className={`toggle-label ${billingPeriod === 'annual' ? 'active' : ''}`} style={{ color: billingPeriod === 'annual' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            Billed Annually <span style={{ color: 'var(--accent-green)', fontSize: '12px', background: 'rgba(0, 242, 126, 0.08)', padding: '2px 8px', borderRadius: '100px', marginLeft: '4px' }}>Save 30%</span>
          </span>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, idx) => (
            <div key={idx} className={`pricing-card glass-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              
              <div className="price-tier">{plan.name}</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{plan.description}</p>
              
              <div className="price-amount">
                <span className="price-val">${billingPeriod === 'monthly' ? plan.price.monthly : plan.price.annual}</span>
                <span className="price-period">/ mo</span>
              </div>
              
              <button className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%' }}>
                Get Started
              </button>
              
              <ul className="price-features">
                {plan.features.map((feat, featIdx) => (
                  <li key={featIdx} className="price-feature-item">
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

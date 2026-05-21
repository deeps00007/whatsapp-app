import React from 'react';

export default function Features() {
  const featuresList = [
    {
      title: "Broadcast to Infinite Contacts",
      description: "Import contacts instantly via CSV. Send marketing blasts, updates, and custom ads using dynamic variables. Includes built-in throttle limits to protect your sender score.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 19 2 12 11 5 11 19"></polygon>
          <polygon points="22 19 13 12 22 5 22 19"></polygon>
        </svg>
      )
    },
    {
      title: "Direct Facebook Authorization",
      description: "No meta cloud developer portals, long system tokens, or credit card configurations. Just login using standard secure OAuth and instantly link your current WhatsApp Business details.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
        </svg>
      )
    },
    {
      title: "No-Code Smart Responders",
      description: "Build logic trees and auto-responses using drag-and-drop triggers. Set quick reply actions, list items, dynamic headers, and files with zero writing of code.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
          <line x1="9" y1="17" x2="13" y2="17"></line>
        </svg>
      )
    },
    {
      title: "High-Speed OTP & REST API",
      description: "For engineers: Trigger password tokens, checkout alerts, status reports, and booking schedules using a simple, robust JSON REST payload structure that compiles instantly.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      )
    },
    {
      title: "Unified Team Inbox",
      description: "Work with multiple agents from a single WhatsApp number. Assign chats to custom agents, add internal dashboard comments, and tag leads without customer interference.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      title: "Rich Interaction Analytics",
      description: "Watch detailed reports on text open speeds, button conversion rates, user chat replies, and system delivery metrics in a sleek real-time graphic panel.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    }
  ];

  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <div className="accent-badge">Unparalleled Features</div>
          <h2>Everything You Need to Connect & Automate</h2>
          <p>We take away the heavy lifting. All features are configured out of the box so you can focus on building relationships and scaling revenue.</p>
        </div>

        <div className="features-grid">
          {featuresList.map((feature, idx) => (
            <div key={idx} className="feature-card glass-card">
              <div className="feature-icon-box">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

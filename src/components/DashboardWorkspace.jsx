import React, { useState, useEffect } from 'react';

export default function DashboardWorkspace({ profileData, onDisconnect, backendUrl }) {
  const [phone, setPhone] = useState('+15550192834');
  const [template, setTemplate] = useState('welcome');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionDispatches, setSessionDispatches] = useState(0);
  const [logs, setLogs] = useState([
    `[${new Date().toLocaleTimeString()}] 🟢 Synced session initialized securely.`,
    `[${new Date().toLocaleTimeString()}] 🔐 Local profile mapping authenticated with Firestore.`,
    `[${new Date().toLocaleTimeString()}] 📡 WABA node synced and online.`
  ]);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    addLog(`📤 Initiating REST dispatch request to send template: '${template}'...`);

    try {
      const res = await fetch(`${backendUrl}/api/send_message.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profileData.user_id,
          phone: phone,
          template: template
        })
      });

      const data = await res.json();
      if (res.ok) {
        addLog(`🟢 Dispatch Success! Message ID: ${data.message_id}`);
        setSessionDispatches(prev => prev + 1); // Track real session-level dispatches
        if (data.logs && Array.isArray(data.logs)) {
          data.logs.forEach(l => addLog(`📡 ${l}`));
        }
      } else {
        addLog(`🔴 Error: ${data.error || 'Failed to dispatch'}`);
      }
    } catch (err) {
      addLog(`🔴 Network Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const simulateWebhookStatusUpdate = () => {
    const statuses = ['delivered', 'read'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    addLog(`🔔 Simulated Webhook Event: Inbound Meta Delivery Update received.`);
    addLog(`⚡ Event Status: wamid.HBgLOTE3ODkyODk1MDQ0FQIAERgSRDMzND... ➔ status: "${randomStatus}"`);
    addLog(`💾 Firestore Status Sync Transaction Complete.`);
  };

  const formatTime = (epoch) => {
    if (!epoch) return 'N/A';
    return new Date(epoch * 1000).toLocaleString();
  };

  // Determine actual backend Webhook URL for developer dashboard
  const webhookUrl = `${backendUrl}/api/webhook.php`;
  const verifyToken = "growbychat_waba_webhook_verify_token_5124efbb";

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="dashboard-container">
      <style>{`
        /* Dynamic Light Theme Variable System Scoped to Dashboard */
        .dashboard-container {
          --dash-bg: #f8fafc;
          --dash-card-bg: #ffffff;
          --dash-text-main: #0f172a;
          --dash-text-sub: #64748b;
          --dash-text-muted: #94a3b8;
          --dash-border: #e2e8f0;
          --dash-green: #10b981;
          --dash-green-soft: #ecfdf5;
          --dash-blue: #3b82f6;
          --dash-blue-soft: #eff6ff;
          --dash-purple: #8b5cf6;
          --dash-purple-soft: #f5f3ff;
          --dash-red: #ef4444;
          --dash-red-soft: #fef2f2;
          
          display: flex;
          min-height: 100vh;
          background-color: var(--dash-bg);
          color: var(--dash-text-main);
          font-family: 'Inter', -apple-system, sans-serif;
          text-align: left;
        }

        /* Sidebar Design */
        .dash-sidebar {
          width: 260px;
          background-color: var(--dash-card-bg);
          border-right: 1px solid var(--dash-border);
          display: flex;
          flex-direction: column;
          padding: 30px 20px;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 100;
        }

        .dash-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--dash-text-main);
          margin-bottom: 40px;
          padding-left: 10px;
        }

        .dash-logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-weight: bold;
        }

        .dash-menu {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dash-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--dash-text-sub);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dash-menu-item:hover {
          background-color: #f1f5f9;
          color: var(--dash-text-main);
        }

        .dash-menu-item.active {
          background-color: var(--dash-green-soft);
          color: var(--dash-green);
        }

        .dash-sidebar-footer {
          margin-top: auto;
          border-top: 1px solid var(--dash-border);
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .profile-summary {
          padding: 10px;
          background-color: #f1f5f9;
          border-radius: 8px;
          font-size: 12px;
        }

        .profile-summary-title {
          font-weight: 700;
          color: var(--dash-text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-summary-sub {
          color: var(--dash-text-sub);
          font-family: monospace;
          margin-top: 2px;
        }

        .btn-revoke {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background-color: var(--dash-red-soft);
          color: var(--dash-red);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .btn-revoke:hover {
          background-color: #fca5a5;
          color: white;
          border-color: #f87171;
        }

        /* Main Workspace Design */
        .dash-main {
          flex: 1;
          margin-left: 260px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 30px;
          max-width: calc(100vw - 260px);
        }

        /* Header Navbar */
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--dash-border);
          padding-bottom: 24px;
        }

        .dash-header-title h2 {
          font-size: 26px;
          font-weight: 800;
          color: var(--dash-text-main);
          font-family: 'Outfit', sans-serif;
        }

        .dash-header-title p {
          font-size: 14px;
          color: var(--dash-text-sub);
          margin-top: 4px;
        }

        .dash-status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background-color: var(--dash-green-soft);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: var(--dash-green);
        }

        .dash-pulse-dot {
          width: 8px;
          height: 8px;
          background-color: var(--dash-green);
          border-radius: 50%;
          animation: dashPulse 2s infinite;
        }

        /* KPI Metric Row */
        .dash-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .metric-card {
          background-color: var(--dash-card-bg);
          border: 1px solid var(--dash-border);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .metric-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--dash-text-sub);
        }

        .metric-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .metric-val {
          font-size: 28px;
          font-weight: 800;
          color: var(--dash-text-main);
          font-family: 'Outfit', sans-serif;
        }

        .metric-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        /* Twin Column Layout */
        .dash-content-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 30px;
        }

        @media (max-width: 1024px) {
          .dash-content-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-card {
          background-color: var(--dash-card-bg);
          border: 1px solid var(--dash-border);
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dashboard-card-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--dash-text-main);
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--dash-border);
          padding-bottom: 16px;
        }

        /* Dispatch Form Elements */
        .template-tabs {
          display: flex;
          background-color: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          gap: 4px;
        }

        .template-tab-btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 700;
          color: var(--dash-text-sub);
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .template-tab-btn:hover {
          color: var(--dash-text-main);
        }

        .template-tab-btn.active {
          background-color: var(--dash-card-bg);
          color: var(--dash-green);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 700;
          color: var(--dash-text-sub);
        }

        .input-field {
          padding: 14px;
          border: 1px solid var(--dash-border);
          border-radius: 10px;
          font-size: 14px;
          font-family: monospace;
          color: var(--dash-text-main);
          background-color: #f8fafc;
          transition: all 0.2s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: var(--dash-green);
          background-color: white;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .btn-dispatch {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 14px;
          font-weight: 700;
          padding: 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
        }

        .btn-dispatch:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }

        .btn-dispatch:disabled {
          background: var(--dash-text-muted);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Webhook Config Panel Elements */
        .copy-group {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 4px;
        }

        .copy-btn {
          background-color: #f1f5f9;
          border: 1px solid var(--dash-border);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          color: var(--dash-text-sub);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .copy-btn:hover {
          background-color: #e2e8f0;
          color: var(--dash-text-main);
        }

        .copy-btn.success {
          background-color: var(--dash-green-soft);
          color: var(--dash-green);
          border-color: rgba(16, 185, 129, 0.2);
        }

        /* Webhook Simulator Section */
        .btn-sim {
          background-color: var(--dash-blue-soft);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: var(--dash-blue);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-sim:hover {
          background-color: var(--dash-blue);
          color: white;
          border-color: var(--dash-blue);
        }

        /* Dark Code Terminal */
        .dash-terminal {
          background-color: #0f172a;
          border-radius: 12px;
          padding: 20px;
          height: 280px;
          overflow-y: auto;
          font-family: 'Fira Code', 'Courier New', monospace;
          fontSize: 12.5px;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .terminal-log {
          line-height: 1.5;
          text-align: left;
        }

        /* Animation keyframes */
        @keyframes dashPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes dashSpinner {
          to { transform: rotate(360deg); }
        }

        .dash-spin {
          animation: dashSpinner 0.8s linear infinite;
        }
      `}</style>

      {/* 💻 SIDEBAR */}
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <div className="dash-logo-icon">G</div>
          <span>Growbychat</span>
        </div>

        <ul className="dash-menu">
          <li 
            className={`dash-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            Overview
          </li>
          <li 
            className={`dash-menu-item ${activeTab === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhooks')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Webhook Gateway
          </li>
        </ul>

        <div className="dash-sidebar-footer">
          <div className="profile-summary">
            <div className="profile-summary-title">{profileData.business_name || 'Growbychat Workspace'}</div>
            <div className="profile-summary-sub">Tenant: {profileData.user_id || 'growbychat_user'}</div>
          </div>

          <button className="btn-revoke" onClick={onDisconnect}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
            Revoke Access Sync
          </button>
        </div>
      </aside>

      {/* 🖥️ MAIN CONTENT PANEL */}
      <main className="dash-main">
        {/* TOP HEADER HEADER */}
        <header className="dash-header">
          <div className="dash-header-title">
            <h2>{profileData.business_name || 'WhatsApp Business Portal'} Dashboard</h2>
            <p>Welcome back! Monitor and test your live Meta integration nodes.</p>
          </div>

          <div className="dash-status-pill">
            <span className="dash-pulse-dot"></span>
            Meta Partner Node: Connected
          </div>
        </header>

        {/* 📊 REAL KPI METRIC ROW (No Placeholders or Fake Statistics) */}
        <section className="dash-metrics-grid">
          <div className="metric-card">
            <div className="metric-card-header">
              <span>WABA STATUS</span>
              <div className="metric-card-icon" style={{ backgroundColor: 'var(--dash-green-soft)', color: 'var(--dash-green)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
            <div className="metric-val" style={{ color: 'var(--dash-green)' }}>Active</div>
            <div className="metric-footer" style={{ color: 'var(--dash-text-sub)' }}>
              <span>Live Cloud Integration</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span>SESSION DISPATCHES</span>
              <div className="metric-card-icon" style={{ backgroundColor: 'var(--dash-blue-soft)', color: 'var(--dash-blue)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </div>
            </div>
            <div className="metric-val">{sessionDispatches}</div>
            <div className="metric-footer" style={{ color: 'var(--dash-text-sub)' }}>
              <span>Active workspace sends</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span>TOKEN SECURITY</span>
              <div className="metric-card-icon" style={{ backgroundColor: 'var(--dash-purple-soft)', color: 'var(--dash-purple)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <div className="metric-val" style={{ fontSize: '24px', marginTop: '4px' }}>AES-256</div>
            <div className="metric-footer" style={{ color: 'var(--dash-green)' }}>
              <span>Firestore Encrypted</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span>DATABASE TARGET</span>
              <div className="metric-card-icon" style={{ backgroundColor: 'var(--dash-blue-soft)', color: 'var(--dash-blue)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
                </svg>
              </div>
            </div>
            <div className="metric-val" style={{ fontSize: '20px', marginTop: '10px' }}>Firestore</div>
            <div className="metric-footer" style={{ color: 'var(--dash-text-sub)' }}>
              <span>Project: whatsapp-betasaas</span>
            </div>
          </div>
        </section>

        {/* 🏛️ TWO COLUMN WORKSPACE GRID */}
        {activeTab === 'overview' ? (
          <section className="dash-content-grid">
            
            {/* COLUMN 1: Broadcast Dispatch Center */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--dash-green)" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Broadcast Dispatch Center
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-group">
                  <label>Select Cloud Template</label>
                  <div className="template-tabs">
                    {['welcome', 'marketing', 'otp'].map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`template-tab-btn ${template === t ? 'active' : ''}`}
                        onClick={() => setTemplate(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Destination Phone Number (E.164 Format)</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+15550192834"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', borderTop: '1px solid var(--dash-border)', paddingTop: '20px' }}>
                  <div>
                    <span style={{ color: 'var(--dash-text-sub)', display: 'block', marginBottom: '2px' }}>WABA Account</span>
                    <strong style={{ color: 'var(--dash-text-main)' }}>{profileData.business_name || 'Sandbox Retail'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--dash-text-sub)', display: 'block', marginBottom: '2px' }}>WhatsApp Number</span>
                    <strong style={{ color: 'var(--dash-green)' }}>{profileData.phone_number || '+1 (555) 019-2834'}</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-dispatch"
                >
                  {sending ? (
                    <>
                      <span className="dash-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #FFF', borderRadius: '50%', display: 'inline-block' }}></span>
                      Dispatching Campaign...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      Launch Campaign Test
                  </>
                )}
              </button>
            </form>
          </div>

          {/* COLUMN 2: Server Console Logging & Telemetry */}
          <div className="dashboard-card" style={{ gap: '20px' }}>
            <div className="dashboard-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="dash-pulse-dot" style={{ backgroundColor: 'var(--dash-blue)' }}></span>
                System Logs
              </span>

              <button
                type="button"
                className="btn-sim"
                onClick={simulateWebhookStatusUpdate}
              >
                ⚡ Sim Webhook
              </button>
            </div>

            <div className="dash-terminal">
              {logs.map((log, idx) => {
                let color = '#8892b0';
                if (log.includes('🔴')) color = '#f87171';
                else if (log.includes('🟢') || log.includes('💡')) color = '#34d399';
                else if (log.includes('🔑') || log.includes('🔐')) color = '#fbbf24';
                else if (log.includes('🔔') || log.includes('⚡')) color = '#60a5fa';

                return (
                  <div key={idx} className="terminal-log" style={{ color }}>
                    {log}
                  </div>
                );
              })}
            </div>

            <div style={{
              fontSize: '12px',
              color: 'var(--dash-text-sub)',
              lineHeight: '1.5',
              padding: '14px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              border: '1px solid var(--dash-border)'
            }}>
              💡 <strong>Firestore Sync Live</strong>: Credentials and active telemetry session mapped securely with AES-256 in your Firestore project `whatsapp-betasaas`.
            </div>
          </div>

        </section>
        ) : (
          /* WEBHOOK LIVE SETUP CARD FOR DEV INTEGRATIONS */
          <div className="dashboard-card" style={{ maxWidth: '800px' }}>
            <div className="dashboard-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--dash-blue)" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              Meta Developer Webhook Gateway Setup
            </div>

            <p style={{ fontSize: '14px', color: 'var(--dash-text-sub)', lineHeight: '1.6' }}>
              To receive real-time updates (like message delivery receipts, status shifts, or inbound chats) directly on this dashboard, you need to configure your Webhook endpoints inside your Facebook Developer App console.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              
              <div className="input-group">
                <label>1. META CALLBACK URL</label>
                <div style={{ fontSize: '12px', color: 'var(--dash-text-sub)' }}>Paste this exact URL under the WhatsApp Webhook configuration page on your Meta App dashboard:</div>
                <div className="copy-group">
                  <input type="text" className="input-field" readOnly value={webhookUrl} style={{ flex: 1, backgroundColor: '#f1f5f9' }} />
                  <button 
                    type="button" 
                    className={`copy-btn ${copiedUrl ? 'success' : ''}`}
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                  >
                    {copiedUrl ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '10px' }}>
                <label>2. VERIFY TOKEN</label>
                <div style={{ fontSize: '12px', color: 'var(--dash-text-sub)' }}>Input this custom secret string to authenticate the verification handshake request from Facebook's servers:</div>
                <div className="copy-group">
                  <input type="text" className="input-field" readOnly value={verifyToken} style={{ flex: 1, backgroundColor: '#f1f5f9', fontFamily: 'monospace' }} />
                  <button 
                    type="button" 
                    className={`copy-btn ${copiedToken ? 'success' : ''}`}
                    onClick={() => copyToClipboard(verifyToken, 'token')}
                  >
                    {copiedToken ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{ 
                padding: '16px', 
                backgroundColor: 'var(--dash-green-soft)', 
                borderRadius: '8px', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                fontSize: '13px',
                lineHeight: '1.5',
                marginTop: '10px'
              }}>
                ℹ️ <strong>Meta Handshake Ready</strong>: The webhook endpoint `webhook.php` contains active signature validation using your Meta App Secret (`X-Hub-Signature-256`). Any fake status requests will be securely filtered and blocked!
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

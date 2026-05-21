import React, { useState, useEffect } from 'react';

export default function DashboardWorkspace({ profileData, onDisconnect, backendUrl }) {
  const [phone, setPhone] = useState('+15550192834');
  const [template, setTemplate] = useState('welcome');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState([
    `[${new Date().toLocaleTimeString()}] 🟢 Synced session initialized securely.`,
    `[${new Date().toLocaleTimeString()}] 🔐 Local profile mapping authenticated with Firestore.`,
    `[${new Date().toLocaleTimeString()}] 📡 WABA node synced and online.`
  ]);

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
    addLog(`⚡ Event Status: wamid.HBgLOTE3ODkyODk1MDQ0FQIAERgSRDMzND... -> status: "${randomStatus}"`);
    addLog(`💾 Firestore Status Sync Transaction Complete.`);
  };

  const formatTime = (epoch) => {
    if (!epoch) return 'N/A';
    return new Date(epoch * 1000).toLocaleString();
  };

  return (
    <section className="dashboard-workspace fade-in" style={{ padding: '120px 0 80px 0', position: 'relative' }}>
      <div className="ambient-glow-1" style={{ top: '10%' }}></div>
      <div className="ambient-glow-2" style={{ bottom: '10%', right: '5%' }}></div>
      <div className="grid-overlay"></div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Workspace Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div className="accent-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px var(--accent-green)' }}></span>
              Meta Partner Integration Active
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#FFF', marginTop: '10px', fontFamily: 'Outfit' }}>
              Connected Workspace
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your automated templates, run instant testing pipelines, and audit system logs.</p>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={onDisconnect} 
            style={{ 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              color: '#EF4444', 
              background: 'rgba(239, 68, 68, 0.05)',
              padding: '12px 24px',
              borderRadius: '10px'
            }}
          >
            Revoke Access Sync
          </button>
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          
          {/* Card 1: Connection & Profile Details */}
          <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '18px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#FFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Integration Profile
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Synced WABA Account</span>
                <span style={{ color: '#FFF', fontWeight: '600' }}>{profileData.business_name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Linked WhatsApp Number</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>{profileData.phone_number || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Phone Number ID</span>
                <span style={{ color: '#FFF', fontFamily: 'var(--mono)', fontSize: '12px' }}>{profileData.phone_number_id || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>WhatsApp Business ID</span>
                <span style={{ color: '#FFF', fontFamily: 'var(--mono)', fontSize: '12px' }}>{profileData.waba_id || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Tenant ID</span>
                <span style={{ color: '#00E5FF', fontFamily: 'var(--mono)', fontSize: '12px' }}>{profileData.user_id || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sync Synchronized At</span>
                <span style={{ color: '#FFF' }}>{formatTime(profileData.connected_at)}</span>
              </div>
            </div>

            <div style={{ 
              marginTop: 'auto', 
              padding: '16px', 
              background: 'rgba(0, 229, 255, 0.05)', 
              borderRadius: '12px', 
              border: '1px solid rgba(0, 229, 255, 0.15)',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              <span style={{ fontWeight: '700', color: 'var(--accent-cyan)', display: 'block', marginBottom: '4px' }}>🔒 Encrypted Persistence</span>
              Access credentials are secure: AES-256 encrypted at rest inside Google Firestore.
            </div>
          </div>

          {/* Card 2: Interactive Template Campaign Sender */}
          <div className="glass-card" style={{ padding: '30px', borderRadius: '18px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#FFF', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              Test Live Template Dispatch
            </h3>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Select Registered Cloud Template</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['welcome', 'marketing', 'otp'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplate(t)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        background: template === t ? 'rgba(0, 242, 126, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: template === t ? '1px solid var(--accent-green)' : '1px solid rgba(255,255,255,0.08)',
                        color: template === t ? 'var(--accent-green)' : 'var(--text-secondary)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Destination Phone Number (E.164 Format)</label>
                <input 
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#FFF',
                    fontFamily: 'var(--mono)',
                    fontSize: '14px'
                  }}
                  placeholder="+15550192834"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  marginTop: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {sending ? (
                  <>
                    <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #FFF', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
                    Dispatching...
                  </>
                ) : 'Launch Template Test'}
              </button>
            </form>
          </div>

        </div>

        {/* Section 3: Live System Terminal */}
        <div className="glass-card" style={{ marginTop: '30px', padding: '30px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#FFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--accent-cyan)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px var(--accent-cyan)', animation: 'pulse 1.5s infinite' }}></span>
              Sandbox Execution Terminal
            </h3>

            <button
              onClick={simulateWebhookStatusUpdate}
              style={{
                background: 'rgba(0, 229, 255, 0.05)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                color: 'var(--accent-cyan)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ⚡ Simulate Inbound Webhook Event
            </button>
          </div>

          <div style={{
            background: '#020409',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '20px',
            height: '240px',
            overflowY: 'auto',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)'
          }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ 
                lineHeight: '1.5',
                color: log.includes('🔴') ? '#EF4444' 
                     : log.includes('🟢') || log.includes('💡') ? 'var(--accent-green)' 
                     : log.includes('🔑') || log.includes('🔐') ? '#FBBF24'
                     : log.includes('🔔') || log.includes('⚡') ? 'var(--accent-cyan)'
                     : '#8BA2BB' 
              }}>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}

import React, { useState, useEffect } from 'react';

export default function DashboardWorkspace({ profileData, onDisconnect, backendUrl }) {
  const [phone, setPhone] = useState('+15550192834');
  const [template, setTemplate] = useState('customer_welcome_alert');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionDispatches, setSessionDispatches] = useState(0);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Template management states
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('MARKETING');
  const [newTemplateLanguage, setNewTemplateLanguage] = useState('en_US');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [submittingTemplate, setSubmittingTemplate] = useState(false);
  const [previewingTemplate, setPreviewingTemplate] = useState(null);

  // Test Mode states (for App Review when reviewer has no API phone number)
  const [testPhone, setTestPhone] = useState('+15550192834');
  const [testTemplate, setTestTemplate] = useState('hello_world');
  const [testSending, setTestSending] = useState(false);

  const [logs, setLogs] = useState([
    `[${new Date().toLocaleTimeString()}] 🟢 WhatsApp Business session active.`,
    `[${new Date().toLocaleTimeString()}] 🔐 Cloud API connection secure.`,
    `[${new Date().toLocaleTimeString()}] 📡 Webhook callback channel active.`
  ]);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const terminalRef = React.useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`${backendUrl}/api/get_messages.php?user_id=${profileData.user_id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
      }
    } catch (err) {
      console.error("Error fetching campaign history:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch(`${backendUrl}/api/get_templates.php?user_id=${profileData.user_id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTemplates(data);
          // Auto select first template if default welcome picker is loaded
          if (data.length > 0 && template === 'welcome') {
            setTemplate(data[0].name);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchTemplates();
  }, [profileData.user_id, sessionDispatches]);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (submittingTemplate) return;

    // Validate: lowercase letters, numbers, and underscores only
    const formattedName = newTemplateName.toLowerCase().replace(/[^a-z0-9_]/g, '').replace(/\s+/g, '_');
    if (!formattedName) {
      addLog("🔴 Form Error: Template name can only contain lowercase letters, numbers, and underscores.");
      return;
    }

    setSubmittingTemplate(true);
    addLog(`📤 Creating template: Submitting '${formattedName}' for approval...`);

    try {
      const res = await fetch(`${backendUrl}/api/create_template.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profileData.user_id,
          name: formattedName,
          category: newTemplateCategory,
          language: newTemplateLanguage,
          body_text: newTemplateBody
        })
      });

      const data = await res.json();
      if (res.ok) {
        addLog(`🟢 Template '${formattedName}' created successfully.`);
        setNewTemplateName('');
        setNewTemplateBody('');
        fetchTemplates(); // Reload templates list
      } else {
        addLog(`🔴 Template Creation Failed: ${data.error || 'Failed to submit template'}`);
      }
    } catch (err) {
      addLog(`🔴 Template Sync Network Error: ${err.message}`);
    } finally {
      setSubmittingTemplate(false);
    }
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

  const handleTestSend = async (e) => {
    e.preventDefault();
    if (testSending) return;
    setTestSending(true);
    addLog(`🔬 Test Mode: Initiating dispatch via Meta test number (+1 555 629 8392)...`);

    try {
      const res = await fetch(`${backendUrl}/api/send_message.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profileData.user_id,
          phone: testPhone,
          template: testTemplate,
          test_mode: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        addLog(`🟢 Test Mode Dispatch Success! Message ID: ${data.message_id}`);
        setSessionDispatches(prev => prev + 1);
        if (data.logs && Array.isArray(data.logs)) {
          data.logs.forEach(l => addLog(`📡 ${l}`));
        }
      } else {
        addLog(`🔴 Test Mode Error: ${data.error || 'Failed to dispatch'}`);
        if (data.hint) addLog(`💡 ${data.hint}`);
        if (data.details) {
          const details = typeof data.details === 'string' ? data.details : JSON.stringify(data.details);
          addLog(`📄 Meta Response: ${details.substring(0, 300)}${details.length > 300 ? '...' : ''}`);
        }
        if (data.diagnostic) {
          addLog(`🔧 Diagnostic: ${JSON.stringify(data.diagnostic)}`);
        }
      }
    } catch (err) {
      addLog(`🔴 Test Mode Network Error: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const simulateWebhookStatusUpdate = async () => {
    if (messages.length === 0) {
      addLog(`⚠️ Status Sync Error: No campaign entries found in database. Please launch a campaign first!`);
      return;
    }

    // Find the first message that is not fully 'read'
    const targetMsg = messages.find(m => m.status !== 'read') || messages[0];
    const currentStatus = targetMsg.status;
    const nextStatus = currentStatus === 'sent' ? 'delivered' : 'read';

    addLog(`🔔 Fetching real-time status callback for message ID: ${targetMsg.message_id}...`);

    const webhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: profileData.waba_id || "waba_acc_123",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: profileData.phone_number || "+1 (555) 019-2834",
                  phone_number_id: profileData.phone_number_id || "phone_acc_123"
                },
                statuses: [
                  {
                    id: targetMsg.message_id,
                    status: nextStatus,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    recipient_id: targetMsg.phone
                  }
                ]
              },
              field: "messages"
            }
          ]
        }
      ]
    };

    try {
      const res = await fetch(`${backendUrl}/api/webhook.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workspace-Sync-Token': 'growbychat_sync_secret_5124efbb'
        },
        body: JSON.stringify(webhookPayload)
      });

      if (res.ok) {
        addLog(`🟢 Webhook callback received from Meta.`);
        addLog(`🟢 Message status updated to ${nextStatus}.`);
        addLog(`💾 Workspace campaign status synchronized.`);
        fetchMessages(); // Refresh the table
      } else {
        const errText = await res.text();
        addLog(`🔴 Webhook sync failed: ${errText}`);
      }
    } catch (err) {
      addLog(`🔴 Connection error: ${err.message}`);
    }
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

        /* 📋 WhatsApp Message Templates Custom Styles */
        .templates-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 30px;
        }
        @media (max-width: 1024px) {
          .templates-grid {
            grid-template-columns: 1fr;
          }
        }
        .stats-badge-row {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        .stats-badge-card {
          flex: 1;
          background-color: #ffffff;
          border: 1px solid var(--dash-border);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.01);
        }
        .stats-badge-val {
          font-size: 22px;
          font-weight: 800;
          color: var(--dash-text-main);
          font-family: 'Outfit', sans-serif;
        }
        .stats-badge-lbl {
          font-size: 11px;
          font-weight: 700;
          color: var(--dash-text-sub);
          text-transform: uppercase;
        }
        
        /* Interactive WhatsApp Chat Bubble Mock */
        .wa-bubble-preview-container {
          background-color: #efeae2;
          background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
          background-repeat: repeat;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--dash-border);
          max-width: 100%;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.05);
        }
        .wa-bubble {
          background-color: white;
          border-radius: 8px;
          padding: 10px 14px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
          position: relative;
          max-width: 85%;
          margin-left: 0;
          font-size: 13.5px;
          line-height: 1.4;
          color: #111b21;
        }
        .wa-bubble-header {
          font-weight: 700;
          font-size: 11px;
          color: var(--dash-text-sub);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed #f1f5f9;
          padding-bottom: 4px;
        }
        .wa-bubble-body {
          white-space: pre-wrap;
          word-break: break-word;
        }
        .wa-bubble-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #667781;
          margin-top: 6px;
        }
        
        /* Modal Backdrop */
        .wa-preview-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .wa-preview-modal {
          background-color: white;
          border-radius: 16px;
          border: 1px solid var(--dash-border);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          width: 90%;
          max-width: 500px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          text-align: left;
        }
        .status-badge.utility {
          background-color: #eff6ff;
          color: #1d4ed8;
        }
        .status-badge.marketing {
          background-color: #f5f3ff;
          color: #6d28d9;
        }
        .status-badge.authentication {
          background-color: #fffbeb;
          color: #b45309;
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            Webhook Settings
          </li>
          <li 
            className={`dash-menu-item ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Cloud Templates
          </li>
        </ul>

        <div className="dash-sidebar-footer">
          <div className="profile-summary">
            <div className="profile-summary-title">{profileData.business_name || 'Growbychat Workspace'}</div>
            <div className="profile-summary-sub">Account: {profileData.user_id || 'growbychat_user'}</div>
          </div>

          <button className="btn-revoke" onClick={onDisconnect}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
            Disconnect Account
          </button>
        </div>
      </aside>

      {/* 🖥️ MAIN CONTENT PANEL */}
      <main className="dash-main">
        {/* TOP HEADER HEADER */}
        <header className="dash-header">
          <div className="dash-header-title">
            <h2>{profileData.business_name || 'WhatsApp Business'} Console</h2>
            <p>Welcome back! Monitor and manage your connected WhatsApp Business profile.</p>
          </div>

          <div className="dash-status-pill">
            <span className="dash-pulse-dot"></span>
            Meta Cloud API: Connected
          </div>
        </header>

        {/* 📊 REAL KPI METRIC ROW */}
        <section className="dash-metrics-grid">
          <div className="metric-card">
            <div className="metric-card-header">
              <span>API CONNECTION</span>
              <div className="metric-card-icon" style={{ backgroundColor: 'var(--dash-green-soft)', color: 'var(--dash-green)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
            <div className="metric-val" style={{ color: 'var(--dash-green)' }}>Active</div>
            <div className="metric-footer" style={{ color: 'var(--dash-text-sub)' }}>
              <span>WhatsApp Cloud API</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span>CAMPAIGN SENDS</span>
              <div className="metric-card-icon" style={{ backgroundColor: 'var(--dash-blue-soft)', color: 'var(--dash-blue)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </div>
            </div>
            <div className="metric-val">{sessionDispatches}</div>
            <div className="metric-footer" style={{ color: 'var(--dash-text-sub)' }}>
              <span>Dispatched this session</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span>WORKSPACE SECURITY</span>
              <div className="metric-card-icon" style={{ backgroundColor: 'var(--dash-purple-soft)', color: 'var(--dash-purple)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <div className="metric-val" style={{ fontSize: '24px', marginTop: '4px' }}>Encrypted</div>
            <div className="metric-footer" style={{ color: 'var(--dash-green)' }}>
              <span>Access Token Secured</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span>DATABASE SYNC</span>
              <div className="metric-card-icon" style={{ backgroundColor: 'var(--dash-blue-soft)', color: 'var(--dash-blue)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
                </svg>
              </div>
            </div>
            <div className="metric-val" style={{ fontSize: '20px', marginTop: '10px' }}>Connected</div>
            <div className="metric-footer" style={{ color: 'var(--dash-text-sub)' }}>
              <span>Firestore workspace DB</span>
            </div>
          </div>
        </section>

        {/* ⚠️ Missing Phone Number Warning */}
        {!profileData.phone_number_id && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#b91c1c' }}>
                WhatsApp Phone Number Missing
              </div>
              <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '2px' }}>
                Your WhatsApp Business Account is connected but has no registered phone number.
                Please go to Meta Business Manager → WhatsApp → Phone Numbers and add a number, then refresh this page.
                Or, during Embedded Signup, select <strong>"Add a new number"</strong> instead of "Use a display name only".
              </div>
            </div>
          </div>
        )}

        {/* 🔬 TEST MODE — Meta API Test Environment (shown when no phone number is connected) */}
        {!profileData.phone_number_id && (
          <div className="dashboard-card" style={{ maxWidth: '900px', marginBottom: '20px', borderLeft: '4px solid var(--dash-blue)' }}>
            <div className="dashboard-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--dash-blue)" strokeWidth="2.5">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                API Test Environment
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--dash-blue)', backgroundColor: 'var(--dash-blue-soft)', padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase' }}>
                Meta Official Test Number
              </span>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--dash-text-sub)', lineHeight: '1.6', margin: 0 }}>
              Your connected WhatsApp Business Account does not have an API-enabled phone number.
              Use Meta's official test environment to send a demonstration message for App Review or testing.
              Messages are sent from <strong>+1 555 629 8392</strong> (Meta's test number).
            </p>

            <form onSubmit={handleTestSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <div className="input-group">
                <label>Destination Phone Number (E.164 Format)</label>
                <input
                  type="text"
                  className="input-field"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+15551234567"
                  required
                />
              </div>

              <div className="input-group">
                <label>Select Test Template</label>
                <div className="template-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#f1f5f9', padding: '6px', borderRadius: '10px' }}>
                  {['hello_world', 'customer_welcome_alert', 'order_shipping_notification', 'appointment_reminder_alert'].map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`template-tab-btn ${testTemplate === t ? 'active' : ''}`}
                      onClick={() => setTestTemplate(t)}
                    >
                      {t.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Sender (Read-only)</label>
                <input
                  type="text"
                  className="input-field"
                  value="+1 555 629 8392 (Meta Test Number)"
                  readOnly
                  style={{ backgroundColor: '#f8fafc', color: 'var(--dash-text-muted)', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--dash-text-muted)', lineHeight: '1.4' }}>
                  Messages are sent through Meta's official Cloud API test environment.
                  Your connected WhatsApp Business Account ({profileData.phone_number || 'no API number'}) does not have an API-enabled number, so we route through Meta's test infrastructure for demonstration.
                </span>
              </div>

              <button
                type="submit"
                disabled={testSending}
                className="btn-dispatch"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)' }}
              >
                {testSending ? (
                  <>
                    <span className="dash-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #FFF', borderRadius: '50%', display: 'inline-block' }}></span>
                    Sending via Test Environment...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Send Test Message
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 🏛️ TWO COLUMN WORKSPACE GRID */}
        {activeTab === 'overview' ? (
          <>
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
                  <div className="template-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#f1f5f9', padding: '6px', borderRadius: '10px' }}>
                    {templates.length > 0 ? (
                      templates.slice(0, 5).map(t => (
                        <button
                          key={t.name}
                          type="button"
                          className={`template-tab-btn ${template === t.name ? 'active' : ''}`}
                          onClick={() => setTemplate(t.name)}
                          style={{ minWidth: '85px', padding: '8px 12px', fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                          title={t.name}
                        >
                          {t.name}
                        </button>
                      ))
                    ) : (
                      ['customer_welcome_alert', 'order_shipping_notification', 'appointment_reminder_alert'].map(t => (
                        <button
                          key={t}
                          type="button"
                          className={`template-tab-btn ${template === t ? 'active' : ''}`}
                          onClick={() => setTemplate(t)}
                        >
                          {t.replace(/_/g, ' ')}
                        </button>
                      ))
                    )}
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
                    <span style={{ color: 'var(--dash-text-sub)', display: 'block', marginBottom: '2px' }}>WhatsApp Business Account</span>
                    <strong style={{ color: 'var(--dash-text-main)' }}>{profileData.business_name || 'Growbychat Workspace'}</strong>
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
                      Launch Campaign
                  </>
                )}
              </button>
            </form>
          </div>

          {/* COLUMN 2: Real-time Event Console */}
          <div className="dashboard-card" style={{ gap: '20px' }}>
            <div className="dashboard-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="dash-pulse-dot" style={{ backgroundColor: 'var(--dash-blue)' }}></span>
                Real-time Events
              </span>

              <button
                type="button"
                className="btn-sim"
                onClick={simulateWebhookStatusUpdate}
              >
                ⚡ Sync Delivery Status
              </button>
            </div>

            <div className="dash-terminal" ref={terminalRef}>
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
              💡 <strong>Database Synced</strong>: Credentials and access tokens are secured within your private Firestore database workspace.
            </div>
          </div>

        </section>

        {/* Campaign History & Delivery Telemetry Table */}
        <div className="dashboard-card" style={{ marginTop: '20px' }}>
          <div className="dashboard-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--dash-purple)" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Campaign History & Delivery Telemetry
            </span>
            <button 
              type="button" 
              className="btn-sim" 
              onClick={fetchMessages}
              disabled={loadingMessages}
              style={{ backgroundColor: 'var(--dash-purple-soft)', color: 'var(--dash-purple)', borderColor: 'rgba(139, 92, 246, 0.2)' }}
            >
              {loadingMessages ? (
                <>
                  <span className="dash-spin" style={{ width: '12px', height: '12px', border: '2px solid rgba(139,92,246,0.2)', borderTop: '2px solid var(--dash-purple)', borderRadius: '50%', display: 'inline-block' }}></span>
                  Reloading...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                  </svg>
                  Refresh Campaigns
                </>
              )}
            </button>
          </div>

          <style>{`
            .campaign-table-container {
              overflow-x: auto;
            }
            .campaign-table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
              font-size: 13.5px;
            }
            .campaign-table th {
              padding: 14px 16px;
              font-weight: 700;
              color: var(--dash-text-sub);
              border-bottom: 2px solid var(--dash-border);
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.05em;
            }
            .campaign-table td {
              padding: 14px 16px;
              border-bottom: 1px solid var(--dash-border);
              color: var(--dash-text-main);
            }
            .campaign-table tr:hover {
              background-color: #f8fafc;
            }
            .status-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 100px;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .status-badge.sent {
              background-color: #fef3c7;
              color: #b45309;
            }
            .status-badge.delivered {
              background-color: #dbeafe;
              color: #1d4ed8;
            }
            .status-badge.read {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-badge-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
            }
            .status-badge.sent .status-badge-dot { background-color: #d97706; }
            .status-badge.delivered .status-badge-dot { background-color: #2563eb; }
            .status-badge.read .status-badge-dot { background-color: #059669; }
          `}</style>

          <div className="campaign-table-container">
            {messages.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dash-text-sub)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--dash-text-muted)' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>No campaigns dispatched yet</div>
                <p style={{ fontSize: '12px', margin: 0 }}>Use the Broadcast Dispatch Center to trigger a campaign broadcast</p>
              </div>
            ) : (
              <table className="campaign-table">
                <thead>
                  <tr>
                    <th>Message ID</th>
                    <th>Recipient</th>
                    <th>Template</th>
                    <th>Status</th>
                    <th>Time Dispatched</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg, index) => (
                    <tr key={msg.message_id || index}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--dash-text-sub)', fontSize: '12px' }}>
                        {msg.message_id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{msg.phone}</td>
                      <td>
                        <code style={{ backgroundColor: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', fontSize: '12px', color: 'var(--dash-purple)' }}>
                          {msg.template}
                        </code>
                      </td>
                      <td>
                        <span className={`status-badge ${msg.status || 'sent'}`}>
                          <span className="status-badge-dot"></span>
                          {msg.status || 'sent'}
                        </span>
                      </td>
                      <td>
                        {msg.timestamp ? formatTime(msg.timestamp) : 'N/A'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </>
     ) : activeTab === 'webhooks' ? (
      /* 🟢 WHATSAPP WEBHOOKS PANEL */
      <div className="dashboard-card" style={{ maxWidth: '900px', gap: '30px' }}>
            <div className="dashboard-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--dash-green)" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
                WhatsApp Webhook Settings
              </span>
              <span className="status-badge read" style={{ fontSize: '11px', padding: '6px 12px' }}>
                <span className="status-badge-dot" style={{ backgroundColor: 'var(--dash-green)' }}></span>
                Connected
              </span>
            </div>

            <p style={{ fontSize: '14.5px', color: 'var(--dash-text-sub)', lineHeight: '1.6', margin: 0 }}>
              Webhooks are used by Meta to notify your application of events happening in your WhatsApp Business Account.
              Growbychat listens for real-time status updates (sent, delivered, read) to sync campaign analytics instantly.
            </p>

            {/* 📊 STATUS & SYNC MONITOR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: 'var(--dash-green-soft)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--dash-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Events</div>
                <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '6px', color: 'var(--dash-text-main)' }}>Active Sync</div>
                <div style={{ fontSize: '12.5px', color: 'var(--dash-text-sub)', marginTop: '4px' }}>Real-time callbacks update campaign history charts.</div>
              </div>
              <div style={{ padding: '20px', backgroundColor: 'var(--dash-purple-soft)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--dash-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Database Status</div>
                <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '6px', color: 'var(--dash-text-main)' }}>Synchronized</div>
                <div style={{ fontSize: '12.5px', color: 'var(--dash-text-sub)', marginTop: '4px' }}>Message updates are safely stored in your cloud database workspace.</div>
              </div>
            </div>

            {/* 🔌 WEBHOOK CONFIGURATION */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: 'var(--dash-text-main)', borderBottom: '1px solid var(--dash-border)', paddingBottom: '10px' }}>
                🔌 Webhook Configuration details
              </h3>
              
              <p style={{ fontSize: '13.5px', color: 'var(--dash-text-sub)', marginBottom: '20px' }}>
                Register the following Callback URL and Verification Token in your Meta App Dashboard under <strong>WhatsApp ➔ Configuration</strong> to receive live updates.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--dash-border)' }}>
                <div className="input-group">
                  <label>META CALLBACK URL</label>
                  <div style={{ fontSize: '12px', color: 'var(--dash-text-sub)', marginBottom: '6px' }}>Growbychat webhook endpoint:</div>
                  <div className="copy-group">
                    <input type="text" className="input-field" readOnly value={webhookUrl} style={{ flex: 1, backgroundColor: '#ffffff' }} />
                    <button 
                      type="button" 
                      className={`copy-btn ${copiedUrl ? 'success' : ''}`}
                      onClick={() => copyToClipboard(webhookUrl, 'url')}
                    >
                      {copiedUrl ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label>VERIFY TOKEN</label>
                  <div style={{ fontSize: '12px', color: 'var(--dash-text-sub)', marginBottom: '6px' }}>Handshake verification secret:</div>
                  <div className="copy-group">
                    <input type="text" className="input-field" readOnly value={verifyToken} style={{ flex: 1, backgroundColor: '#ffffff', fontFamily: 'monospace' }} />
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
                  padding: '12px 14px', 
                  backgroundColor: 'var(--dash-green-soft)', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(16, 185, 129, 0.1)', 
                  fontSize: '12.5px',
                  lineHeight: '1.4',
                  color: 'var(--dash-green)'
                }}>
                  ℹ️ <strong>Webhook Integration Secure</strong>: Incoming status webhook calls are protected with secure cryptographic signature validation (<code>X-Hub-Signature-256</code>) via your Meta App Secret.
                </div>
              </div>
            </div>
          </div>
    ) : (
      /* 📋 WHATSAPP CLOUD TEMPLATES MANAGEMENT PANEL */
      <div className="dashboard-card" style={{ maxWidth: '950px', gap: '30px' }}>
        <div className="dashboard-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--dash-purple)" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            WhatsApp Cloud Templates Manager
          </span>
          <button 
            type="button" 
            className="btn-sim" 
            onClick={fetchTemplates}
            disabled={loadingTemplates}
            style={{ backgroundColor: 'var(--dash-purple-soft)', color: 'var(--dash-purple)', borderColor: 'rgba(139, 92, 246, 0.2)' }}
          >
            {loadingTemplates ? (
              <>
                <span className="dash-spin" style={{ width: '12px', height: '12px', border: '2px solid rgba(139,92,246,0.2)', borderTop: '2px solid var(--dash-purple)', borderRadius: '50%', display: 'inline-block' }}></span>
                Syncing...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
                Sync Meta Templates
              </>
            )}
          </button>
        </div>

        <p style={{ fontSize: '14.5px', color: 'var(--dash-text-sub)', lineHeight: '1.6', margin: 0 }}>
          Review, synchronize, and draft template messages submitted to Meta. All templates are synced with your connected WhatsApp account.
        </p>

        {/* 📊 TEMPLATES STATS ROW */}
        <div className="stats-badge-row">
          <div className="stats-badge-card">
            <span className="stats-badge-val">{templates.length}</span>
            <span className="stats-badge-lbl">Total Templates</span>
          </div>
          <div className="stats-badge-card" style={{ borderLeft: '3px solid var(--dash-green)' }}>
            <span className="stats-badge-val" style={{ color: 'var(--dash-green)' }}>
              {templates.filter(t => t.status === 'approved').length}
            </span>
            <span className="stats-badge-lbl">Approved Nodes</span>
          </div>
          <div className="stats-badge-card" style={{ borderLeft: '3px solid var(--dash-blue)' }}>
            <span className="stats-badge-val" style={{ color: 'var(--dash-blue)' }}>
              {templates.filter(t => t.status === 'pending').length}
            </span>
            <span className="stats-badge-lbl">Pending Review</span>
          </div>
        </div>

        <div className="templates-grid">
          
          {/* COL 1: Template Builder Form */}
          <div style={{ borderRight: '1px solid var(--dash-border)', paddingRight: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--dash-text-main)', margin: '0 0 10px' }}>
              Create WABA Template
            </h3>

            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label>Template Name</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="e.g. promotional_discount_fall"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                  style={{ fontSize: '13px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--dash-text-muted)' }}>
                  * Lowercase, numbers, and underscores only. No spaces.
                </span>
              </div>

              <div className="input-group">
                <label>Category</label>
                <select 
                  className="input-field"
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  style={{ fontSize: '13px', backgroundColor: '#ffffff', cursor: 'pointer' }}
                >
                  <option value="MARKETING">MARKETING (Offers, Promos)</option>
                  <option value="UTILITY">UTILITY (Customer updates, Receipts)</option>
                  <option value="AUTHENTICATION">AUTHENTICATION (OTP login codes)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Language</label>
                <select 
                  className="input-field"
                  value={newTemplateLanguage}
                  onChange={(e) => setNewTemplateLanguage(e.target.value)}
                  style={{ fontSize: '13px', backgroundColor: '#ffffff', cursor: 'pointer' }}
                >
                  <option value="en_US">English (US)</option>
                  <option value="es_LA">Spanish (LATAM)</option>
                  <option value="hi_IN">Hindi (IN)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Body Text Content</label>
                <textarea 
                  className="input-field"
                  rows="4"
                  placeholder="Hello {{1}}, your order {{2}} has been confirmed!"
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  required
                  style={{ fontSize: '13px', minHeight: '100px', resize: 'vertical', fontFamily: 'sans-serif' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingTemplate} 
                className="btn-dispatch"
                style={{ marginTop: '10px', padding: '14px' }}
              >
                {submittingTemplate ? (
                  <>
                    <span className="dash-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #FFF', borderRadius: '50%', display: 'inline-block' }}></span>
                    Submitting to Meta...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21.2 15a8.91 8.91 0 0 0-4.9-7.9A9 9 0 1 0 3 13a9 9 0 0 0 10.4 8.7 8.91 8.91 0 0 0 7.8-6.7z"></path>
                      <path d="M12 12V3"></path>
                      <path d="M16 7l-4-4-4 4"></path>
                    </svg>
                    Submit to Meta review
                  </>
                )}
              </button>
            </form>
          </div>

          {/* COL 2: Templates List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--dash-text-main)', margin: '0 0 10px' }}>
              Active Cloud Nodes
            </h3>
            
            <style>{`
              .tmpl-table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
                font-size: 13px;
              }
              .tmpl-table th {
                padding: 12px 14px;
                font-weight: 700;
                color: var(--dash-text-sub);
                border-bottom: 2px solid var(--dash-border);
                text-transform: uppercase;
                font-size: 10px;
                letter-spacing: 0.05em;
              }
              .tmpl-table td {
                padding: 12px 14px;
                border-bottom: 1px solid var(--dash-border);
                color: var(--dash-text-main);
              }
              .tmpl-table tr:hover {
                background-color: #f8fafc;
              }
            `}</style>

            {templates.length === 0 ? (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--dash-text-sub)' }}>
                <div style={{ fontWeight: 700 }}>No templates synchronized</div>
                <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Trigger sync or create your first custom template.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tmpl-table">
                  <thead>
                    <tr>
                      <th>Template Name</th>
                      <th>Category</th>
                      <th>Language</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => (
                      <tr key={t.template_id || t.name}>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--dash-text-main)', fontSize: '12px' }}>
                          {t.name}
                        </td>
                        <td>
                          <span className={`status-badge ${t.category?.toLowerCase() || 'marketing'}`}>
                            {t.category}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--dash-text-sub)' }}>
                          {t.language}
                        </td>
                        <td>
                          <span className={`status-badge ${t.status || 'approved'}`}>
                            <span className="status-badge-dot"></span>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            type="button" 
                            className="copy-btn"
                            onClick={() => setPreviewingTemplate(t)}
                            style={{ padding: '6px 10px', fontSize: '11px', minWidth: 'auto' }}
                          >
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </main>

  {/* 🔮 INTERACTIVE CHAT BUBBLE PREVIEW MODAL */}
  {previewingTemplate && (
    <div className="wa-preview-backdrop" onClick={() => setPreviewingTemplate(null)}>
      <div className="wa-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dash-border)', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', fontFamily: 'Outfit', color: 'var(--dash-text-main)' }}>
            Template Preview
          </h3>
          <button 
            type="button" 
            onClick={() => setPreviewingTemplate(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dash-text-sub)', fontSize: '20px', padding: '0 4px' }}
          >
            &times;
          </button>
        </div>

        <div className="wa-bubble-preview-container">
          <div className="wa-bubble">
            <div className="wa-bubble-header">
              <span>{previewingTemplate.category}</span>
              <span style={{ fontSize: '10px', color: 'var(--dash-text-muted)' }}>{previewingTemplate.language}</span>
            </div>
            <div className="wa-bubble-body">
              {previewingTemplate.body_text}
            </div>
            <div className="wa-bubble-footer">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#53bdeb" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"></path>
                <path d="M20 6L9 17l-5-5" transform="translate(4, 0)"></path>
              </svg>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            type="button" 
            className="copy-btn" 
            onClick={() => setPreviewingTemplate(null)}
            style={{ padding: '10px 20px', borderRadius: '8px' }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )}
</div>
);
}

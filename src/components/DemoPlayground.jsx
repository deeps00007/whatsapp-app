import React, { useState, useEffect } from 'react';

export default function DemoPlayground() {
  const [activeTemplate, setActiveTemplate] = useState('welcome'); // welcome, marketing, otp
  const [customText, setCustomText] = useState('Hey {{name}}, thank you for choosing Growbychat! To complete your registration, select one of the quick options below.');
  const [includeImage, setIncludeImage] = useState(true);
  const [buttonsCount, setButtonsCount] = useState(2); // 1, 2, or 3
  
  const [messages, setMessages] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    resetDemo();
  }, [activeTemplate]);

  const resetDemo = () => {
    if (activeTemplate === 'welcome') {
      setCustomText('Hey {{name}}, thank you for choosing Growbychat! To complete your registration, select one of the quick options below.');
      setIncludeImage(true);
      setButtonsCount(2);
      setMessages([
        {
          id: 'initial',
          text: 'Hey John, thank you for choosing Growbychat! To complete your registration, select one of the quick options below.',
          incoming: false,
          time: '10:00 AM',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=200&fit=crop',
          buttons: ['Verify Account', 'View Dashboard']
        }
      ]);
      setSystemLogs([
        '🟢 Bot Server active and listening.',
        '🔄 Webhook mapped to Facebook page secure tunnel.'
      ]);
    } else if (activeTemplate === 'marketing') {
      setCustomText('⚡ FLASH SALE: Hey {{name}}, get 30% off our pro tier today only. Use code PRO30 at checkout.');
      setIncludeImage(false);
      setButtonsCount(1);
      setMessages([
        {
          id: 'initial',
          text: '⚡ FLASH SALE: Hey Sarah, get 30% off our pro tier today only. Use code PRO30 at checkout.',
          incoming: false,
          time: '2:15 PM',
          buttons: ['Claim 30% Discount']
        }
      ]);
      setSystemLogs([
        '📈 Bulk campaign "Sarah & 4,500 contacts" created.',
        '🚀 Safe queue throttle limit set: 1 text every 1.5 seconds.'
      ]);
    } else if (activeTemplate === 'otp') {
      setCustomText('Your Growbychat authorization code is: 582-903. Do not share this token. It will expire in 5 minutes.');
      setIncludeImage(false);
      setButtonsCount(0);
      setMessages([
        {
          id: 'initial',
          text: 'Your Growbychat authorization code is: 582-903. Do not share this token. It will expire in 5 minutes.',
          incoming: false,
          time: '5:41 PM'
        }
      ]);
      setSystemLogs([
        '🔌 API Request received from: 192.168.1.1',
        '🔑 Auth check passed for API token ending in ...9f8a',
        '🚀 OTP message generated for destination +1 (555) 019-2834'
      ]);
    }
  };

  const updateMessageContent = (text, imgFlag, btnCount) => {
    // Replace placeholder with mock name
    const resolvedText = text.replace(/\{\{name\}\}/g, 'Alex');
    
    let buttons = [];
    if (btnCount >= 1) buttons.push('Quick Action 1');
    if (btnCount >= 2) buttons.push('Quick Action 2');
    if (btnCount >= 3) buttons.push('Quick Action 3');

    setMessages([
      {
        id: 'initial',
        text: resolvedText,
        incoming: false,
        time: 'Now',
        image: imgFlag ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=200&fit=crop' : null,
        buttons: buttons
      }
    ]);
  };

  const handleInputChange = (e) => {
    setCustomText(e.target.value);
    updateMessageContent(e.target.value, includeImage, buttonsCount);
  };

  const handleImageToggle = () => {
    const nextVal = !includeImage;
    setIncludeImage(nextVal);
    updateMessageContent(customText, nextVal, buttonsCount);
  };

  const handleButtonsCountChange = (count) => {
    setButtonsCount(count);
    updateMessageContent(customText, includeImage, count);
  };

  const handlePhoneButtonClick = (btnText) => {
    // Add user response message
    const newMsg = {
      id: Date.now() + '-user',
      text: btnText,
      incoming: true,
      time: 'Just now'
    };
    
    setMessages(prev => [...prev, newMsg]);
    setIsTyping(true);

    setSystemLogs(prev => [
      ...prev,
      `📩 Message received: "${btnText}" from contact.`,
      `⚙️ Chatbot logic searching triggers for "${btnText}"...`
    ]);

    setTimeout(() => {
      setIsTyping(false);
      let replyText = "Awesome! Your response was registered instantly. This chatbot response took less than 200ms to calculate and fire back ⚡";
      
      if (btnText === 'Verify Account') {
        replyText = "🔒 Your account has been verified successfully! Welcome to Growbychat.";
      } else if (btnText === 'View Dashboard') {
        replyText = "🖥️ Directing you to your admin control center...";
      } else if (btnText === 'Claim 30% Discount') {
        replyText = "🎉 Coupon PRO30 applied! Proceed to checkout to claim your 30% life-time rebate.";
      }

      setMessages(prev => [...prev, {
        id: Date.now() + '-bot',
        text: replyText,
        incoming: false,
        time: 'Just now'
      }]);

      setSystemLogs(prev => [
        ...prev,
        `🚀 Auto-reply sent matching trigger event: "${btnText}".`
      ]);
    }, 1500);
  };

  return (
    <section className="sandbox" id="playground">
      <div className="container">
        <div className="section-header">
          <div className="accent-badge">Live Interactive Simulator</div>
          <h2>Playground: Craft Your Perfect Flow</h2>
          <p>Don't take our word for it. Try customizing a mock message below and interact directly with our simulated phone dashboard to watch our system in action!</p>
        </div>

        <div className="sandbox-container">
          {/* Controls & Configuration */}
          <div className="sandbox-controls glass-card">
            <div className="playground-options">
              <button 
                className={`option-btn ${activeTemplate === 'welcome' ? 'active' : ''}`}
                onClick={() => setActiveTemplate('welcome')}
              >
                Welcome Automation
              </button>
              <button 
                className={`option-btn ${activeTemplate === 'marketing' ? 'active' : ''}`}
                onClick={() => setActiveTemplate('marketing')}
              >
                Marketing Blast
              </button>
              <button 
                className={`option-btn ${activeTemplate === 'otp' ? 'active' : ''}`}
                onClick={() => setActiveTemplate('otp')}
              >
                REST API / OTP Token
              </button>
            </div>

            <div className="sandbox-form">
              <div className="form-group">
                <label>Message Content (Supports dynamic attributes like `{"{{name}}"}`)</label>
                <textarea 
                  className="form-textarea" 
                  rows="4" 
                  value={customText}
                  onChange={handleInputChange}
                  placeholder="Type WhatsApp message contents..."
                ></textarea>
              </div>

              {activeTemplate !== 'otp' && (
                <>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      id="img-toggle" 
                      checked={includeImage} 
                      onChange={handleImageToggle}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-green)' }}
                    />
                    <label htmlFor="img-toggle" style={{ cursor: 'pointer' }}>Include Header Image Attachment</label>
                  </div>

                  <div className="form-group">
                    <label>WhatsApp Interactive Buttons ({buttonsCount})</label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      {[0, 1, 2, 3].map(val => (
                        <button 
                          key={val} 
                          className={`option-btn ${buttonsCount === val ? 'active' : ''}`} 
                          onClick={() => handleButtonsCountChange(val)}
                          style={{ padding: '8px' }}
                        >
                          {val === 0 ? 'None' : `${val} Button${val > 1 ? 's' : ''}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Simulated Server Logging Output */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block' }}></span>
                System Logs Console
              </h4>
              <div style={{ background: '#02040a', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', height: '110px', overflowY: 'auto', fontFamily: 'var(--mono)', fontSize: '11px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {systemLogs.map((log, idx) => (
                  <div key={idx} style={{ color: log.startsWith('🟢') || log.startsWith('🚀') ? 'var(--accent-green)' : log.startsWith('📩') ? 'var(--accent-cyan)' : '#8ba2bb' }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulated WhatsApp Phone Rendering */}
          <div>
            <div className="virtual-phone" style={{ height: '540px', maxWidth: '340px', margin: '0 auto' }}>
              <div className="phone-header" style={{ background: '#075E54' }}>
                <div className="phone-avatar" style={{ background: '#128C7E', color: 'white' }}>GC</div>
                <div className="phone-user-info">
                  <h5 style={{ color: 'white' }}>Growbychat Campaign</h5>
                  <span style={{ color: '#25D366' }}>Online / Interactive</span>
                </div>
              </div>

              <div className="phone-body" style={{ background: '#ECE5DD' }}>
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`msg ${msg.incoming ? 'msg-incoming' : 'msg-outgoing'}`}
                    style={{ 
                      background: msg.incoming ? '#FFFFFF' : '#DCF8C6', 
                      color: '#303030', 
                      maxWidth: '85%',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                    }}
                  >
                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="Preview" 
                        style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', display: 'block', maxHeight: '120px', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    
                    {/* Render quick reply buttons inside message card */}
                    {msg.buttons && msg.buttons.map((btnText, btnIdx) => (
                      <div 
                        key={btnIdx} 
                        className="msg-btn"
                        onClick={() => handlePhoneButtonClick(btnText)}
                        style={{ 
                          background: '#FFFFFF', 
                          color: '#075E54', 
                          border: '1px solid rgba(0,0,0,0.05)', 
                          fontSize: '12px',
                          display: 'block',
                          width: '100%',
                          marginTop: '6px',
                          padding: '8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          textAlign: 'center'
                        }}
                      >
                        {btnText}
                      </div>
                    ))}
                    
                    <div className="msg-time" style={{ color: 'rgba(0,0,0,0.4)', textAlign: 'right', fontSize: '9px', marginTop: '4px' }}>
                      {msg.time}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="msg msg-incoming" style={{ background: '#FFFFFF', color: '#888888', fontStyle: 'italic', padding: '6px 12px', borderRadius: '8px', alignSelf: 'flex-start' }}>
                    typing...
                  </div>
                )}
              </div>

              <div className="phone-footer" style={{ background: '#F0F0F0' }}>
                <input 
                  type="text" 
                  className="phone-input" 
                  style={{ background: '#FFFFFF', color: '#000000' }}
                  placeholder="Interactive sandbox..." 
                  disabled
                />
                <button className="phone-send" style={{ background: '#075E54' }} disabled>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

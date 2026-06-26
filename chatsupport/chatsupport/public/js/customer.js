// Initialize Socket.io connection
const socket = io();

// State variables
let conversationId = localStorage.getItem('chat_conversation_id');
let customerName = localStorage.getItem('chat_customer_name');
let typingTimeout = null;
let isTyping = false;

// DOM Elements
const setupOverlay = document.getElementById('setupOverlay');
const customerNameInput = document.getElementById('customerNameInput');
const startChatBtn = document.getElementById('startChatBtn');
const chatBox = document.getElementById('chatBox');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatForm = document.getElementById('chatForm');
const sendBtn = document.getElementById('sendBtn');
const statusIndicator = document.getElementById('statusIndicator');
const chatSubStatus = document.getElementById('chatSubStatus');
const typingIndicator = document.getElementById('typingIndicator');
const quickRepliesPanel = document.getElementById('quickRepliesPanel');
const resetSessionBtn = document.getElementById('resetSessionBtn');

// Helper to generate a unique random client-side UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Check for existing session on page load
if (customerName && conversationId) {
  startChat(customerName, conversationId);
}

// Onboard user
startChatBtn.addEventListener('click', () => {
  const name = customerNameInput.value.trim();
  if (!name) {
    alert('Please enter a valid name.');
    return;
  }
  
  customerName = name;
  conversationId = generateUUID();
  
  localStorage.setItem('chat_customer_name', customerName);
  localStorage.setItem('chat_conversation_id', conversationId);
  
  startChat(customerName, conversationId);
});

// Allow Enter key in the onboarding field
customerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    startChatBtn.click();
  }
});

// Setup reset handler
resetSessionBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.reload();
});

// Boots the socket session
function startChat(name, id) {
  setupOverlay.style.display = 'none';
  chatBox.style.display = 'flex';
  
  // Connect to the room
  socket.emit('customer:join', { conversationId: id, customerName: name });
  
  // Enable UI inputs
  chatInput.removeAttribute('disabled');
  sendBtn.removeAttribute('disabled');
  chatInput.focus();
}

// --- SOCKET EVENT LISTENERS ---

socket.on('connect', () => {
  statusIndicator.className = 'brand-dot';
  updateHeaderStatus('bot'); // Default, will override on history load
});

socket.on('disconnect', () => {
  statusIndicator.className = 'brand-dot loading';
  chatSubStatus.innerText = 'Connection lost. Reconnecting...';
});

// Load full history log
socket.on('conversation:history', ({ conversation, messages }) => {
  chatMessages.innerHTML = ''; // Clear container
  
  messages.forEach(msg => {
    appendMessageBubble(msg.sender_type, msg.sender_name, msg.content, msg.created_at);
  });
  
  scrollToBottom();
  updateHeaderStatus(conversation.status);
});

// Handle real-time incoming messages
socket.on('message:receive', (msg) => {
  appendMessageBubble(msg.sender_type, msg.sender_name, msg.content, msg.created_at);
  scrollToBottom();
});

// Receive status changes (e.g. claimed by agent, closed)
socket.on('conversation:status_change', (convo) => {
  updateHeaderStatus(convo.status);
});

// Listen to agent / bot typing status
socket.on('message:typing', ({ senderType, isTyping: typingState }) => {
  if (senderType !== 'customer') {
    if (typingState) {
      typingIndicator.style.display = 'flex';
      scrollToBottom();
    } else {
      typingIndicator.style.display = 'none';
    }
  }
});

// --- RENDER HELPERS ---

function appendMessageBubble(senderType, senderName, content, timestamp) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${senderType}`;
  
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Replace line breaks with HTML paragraph wraps
  const formattedContent = content.replace(/\n/g, '<br>');

  messageDiv.innerHTML = `
    <span class="message-meta">${senderName} • ${formattedTime}</span>
    <div class="message-content">${formattedContent}</div>
  `;
  
  chatMessages.appendChild(messageDiv);
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Dynamically handles layout changes depending on convo state
function updateHeaderStatus(status) {
  if (status === 'bot') {
    chatSubStatus.innerText = 'Automated Assistant';
    quickRepliesPanel.style.display = 'flex';
    chatInput.removeAttribute('disabled');
    sendBtn.removeAttribute('disabled');
  } else if (status === 'queued') {
    chatSubStatus.innerText = 'Waiting for Support Agent...';
    quickRepliesPanel.style.display = 'none';
    chatInput.removeAttribute('disabled');
    sendBtn.removeAttribute('disabled');
  } else if (status === 'agent') {
    chatSubStatus.innerText = 'Connected to Support Team';
    quickRepliesPanel.style.display = 'none';
    chatInput.removeAttribute('disabled');
    sendBtn.removeAttribute('disabled');
  } else if (status === 'closed') {
    chatSubStatus.innerText = 'Support Session Resolved';
    quickRepliesPanel.style.display = 'none';
    chatInput.setAttribute('disabled', 'true');
    sendBtn.setAttribute('disabled', 'true');
  }
}

// --- CLIENT EMISSIONS ---

// Handle standard form submissions
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  
  // Turn off typing state
  clearTimeout(typingTimeout);
  sendTypingStatus(false);

  // Send message
  socket.emit('message:send', {
    conversationId,
    senderType: 'customer',
    senderName: customerName,
    content: text
  });
  
  chatInput.value = '';
  chatInput.focus();
});

// Handle quick options selection
quickRepliesPanel.addEventListener('click', (e) => {
  const btn = e.target.closest('.quick-btn');
  if (!btn) return;
  
  const value = btn.getAttribute('data-value');
  const textLabel = btn.innerText;

  // Render selection locally instantly
  socket.emit('message:send', {
    conversationId,
    senderType: 'customer',
    senderName: customerName,
    content: textLabel
  });
});

// Track keystrokes to dispatch typing notifications
chatInput.addEventListener('input', () => {
  if (!isTyping) {
    sendTypingStatus(true);
  }
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    sendTypingStatus(false);
  }, 1000); // Trigger inactive after 1s of stillness
});

function sendTypingStatus(state) {
  isTyping = state;
  socket.emit('message:typing', {
    conversationId,
    senderType: 'customer',
    isTyping: state
  });
}

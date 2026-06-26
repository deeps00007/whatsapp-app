// ══════════════════════════════════════════════
//  SUPPORT HUB — Agent Dashboard Logic
// ══════════════════════════════════════════════

const socket = io();

// ── State ──
let activeAgent = null;
let activeConversationId = null;
let conversations = [];
let typingTimeout = null;
let isTyping = false;
let activeTab = 'all';

// ── DOM refs ──
const agentSetupOverlay   = document.getElementById('agentSetupOverlay');
const agentIdInput        = document.getElementById('agentIdInput');
const agentNameInput      = document.getElementById('agentNameInput');
const agentLoginBtn       = document.getElementById('agentLoginBtn');
const agentProfileLabel   = document.getElementById('agentProfileLabel');
const agentAvatarEl       = document.getElementById('agentAvatarEl');
const agentStatusSelector = document.getElementById('agentStatusSelector');

const statQueued      = document.getElementById('statQueued');
const statClaimed     = document.getElementById('statClaimed');
const statTotalActive = document.getElementById('statTotalActive');
const statAgentsOnline= document.getElementById('statAgentsOnline');
const conversationCount = document.getElementById('conversationCount');

const chatListScroller  = document.getElementById('chatListScroller');
const chatPaneEmptyState= document.getElementById('chatPaneEmptyState');
const chatConsoleWrapper= document.getElementById('chatConsoleWrapper');

const claimBanner    = document.getElementById('claimBanner');
const claimConvoBtn  = document.getElementById('claimConvoBtn');
const agentChatMessages  = document.getElementById('agentChatMessages');
const agentTypingIndicator = document.getElementById('agentTypingIndicator');
const agentChatInput = document.getElementById('agentChatInput');
const agentChatForm  = document.getElementById('agentChatForm');
const agentSendBtn   = document.getElementById('agentSendBtn');

const transferToBotBtn = document.getElementById('transferToBotBtn');
const closeTicketBtn   = document.getElementById('closeTicketBtn');

const contextWrapper   = document.getElementById('contextWrapper');
const contextEmptyLabel= document.getElementById('contextEmptyLabel');
const ctxCustomerName  = document.getElementById('ctxCustomerName');
const ctxConvoId       = document.getElementById('ctxConvoId');
const ctxConvoStatus   = document.getElementById('ctxConvoStatus');
const ctxStatusChip    = document.getElementById('ctxStatusChip');
const ctxFailoverAlert = document.getElementById('ctxFailoverAlert');
const agentListContainer = document.getElementById('agentListContainer');

// New UI refs
const consoleAvatarEl     = document.getElementById('consoleAvatarEl');
const consoleCustomerName = document.getElementById('consoleCustomerName');
const consoleConvoMeta    = document.getElementById('consoleConvoMeta');
const threadSearch        = document.getElementById('threadSearch');

// ══════════════════════════════════════════════
//  AGENT ONBOARDING
// ══════════════════════════════════════════════

const savedAgentId   = sessionStorage.getItem('agent_id');
const savedAgentName = sessionStorage.getItem('agent_name');

if (savedAgentId && savedAgentName) {
  loginAgent(savedAgentId, savedAgentName);
}

agentLoginBtn.addEventListener('click', () => {
  const id   = agentIdInput.value.trim();
  const name = agentNameInput.value.trim();
  if (!id || !name) {
    shakeInput(agentIdInput);
    return;
  }
  sessionStorage.setItem('agent_id', id);
  sessionStorage.setItem('agent_name', name);
  loginAgent(id, name);
});

agentIdInput.addEventListener('keypress', e   => { if (e.key === 'Enter') agentNameInput.focus(); });
agentNameInput.addEventListener('keypress', e => { if (e.key === 'Enter') agentLoginBtn.click(); });

function loginAgent(id, name) {
  activeAgent = { id, name };
  agentSetupOverlay.style.display = 'none';

  // Update topbar profile
  agentProfileLabel.textContent = name;
  if (agentAvatarEl) agentAvatarEl.textContent = name.charAt(0).toUpperCase();

  socket.emit('agent:join', { agentId: id, agentName: name });
}

agentStatusSelector.addEventListener('change', e => {
  if (!activeAgent) return;
  socket.emit('agent:status_change', { agentId: activeAgent.id, status: e.target.value });
});

// Helper: shake an input on validation error
function shakeInput(el) {
  el.style.borderColor = 'var(--error)';
  el.focus();
  setTimeout(() => el.style.borderColor = '', 1500);
}

// ══════════════════════════════════════════════
//  SOCKET EVENT HANDLERS
// ══════════════════════════════════════════════

socket.on('queue:data', data => {
  conversations = data;
  renderStats();
  renderSidebarThreads();

  if (activeConversationId) {
    const updated = conversations.find(c => c.id === activeConversationId);
    if (updated) updateActiveConvoState(updated);
  }
});

socket.on('agents:update', agents => {
  statAgentsOnline.textContent = agents.length;
  renderAgentList(agents);
});

socket.on('message:receive', msg => {
  if (msg.conversation_id === activeConversationId) {
    appendMessageBubble(msg.sender_type, msg.sender_name, msg.content, msg.created_at);
    scrollToBottom();
    if (msg.sender_type === 'customer') {
      agentTypingIndicator.style.display = 'none';
    }
  }
});

socket.on('message:typing', ({ senderType, isTyping: typingState }) => {
  if (senderType === 'customer') {
    agentTypingIndicator.style.display = typingState ? 'block' : 'none';
    if (typingState) scrollToBottom();
  }
});

// ══════════════════════════════════════════════
//  RENDER HELPERS
// ══════════════════════════════════════════════

function renderStats() {
  if (!activeAgent) return;
  const queued  = conversations.filter(c => c.status === 'queued').length;
  const claimed = conversations.filter(c => c.status === 'agent' && c.assigned_agent_id === activeAgent.id).length;

  statQueued.textContent      = queued;
  statClaimed.textContent     = claimed;
  statTotalActive.textContent = conversations.length;
  if (conversationCount) conversationCount.textContent = conversations.length;
}

function getFilteredConversations() {
  let filtered = conversations;
  if (activeTab !== 'all') {
    filtered = conversations.filter(c => c.status === activeTab);
  }

  const q = threadSearch ? threadSearch.value.toLowerCase().trim() : '';
  if (q) {
    filtered = filtered.filter(c =>
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  }

  return filtered;
}

function renderSidebarThreads() {
  const filtered = getFilteredConversations();

  if (filtered.length === 0) {
    chatListScroller.innerHTML = `
      <div class="empty-list-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>No conversations found</p>
      </div>`;
    return;
  }

  chatListScroller.innerHTML = '';

  // Sort: queued → my agent → other agent → bot → closed
  const priority = { queued: 1, agent: 2, bot: 3, closed: 4 };
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'agent' && b.status === 'agent') {
      if (a.assigned_agent_id === activeAgent?.id) return -1;
      if (b.assigned_agent_id === activeAgent?.id) return 1;
    }
    return (priority[a.status] || 9) - (priority[b.status] || 9);
  });

  sorted.forEach(convo => {
    const isSelected = convo.id === activeConversationId;
    const initial = (convo.customer_name || '?').charAt(0).toUpperCase();
    const chipClass = getChipClass(convo.status, convo.assigned_agent_id);
    const chipLabel = getStatusLabel(convo.status, convo.assigned_agent_id);
    const avatarColor = getAvatarColor(convo.customer_name || '');

    const el = document.createElement('div');
    el.className = `thread-item${isSelected ? ' active' : ''}`;
    el.onclick = () => selectThread(convo.id);
    el.innerHTML = `
      <div class="thread-top">
        <div class="thread-avatar" style="background:${avatarColor}">${initial}</div>
        <div class="thread-body">
          <span class="thread-name">${escapeHtml(convo.customer_name || 'Customer')}</span>
          <span class="thread-preview">Status: ${chipLabel}</span>
        </div>
        <div class="thread-meta">
          <span class="status-chip ${chipClass}">${chipLabel}</span>
        </div>
      </div>`;
    chatListScroller.appendChild(el);
  });
}

function renderAgentList(agents) {
  agentListContainer.innerHTML = '';
  if (!agents || agents.length === 0) {
    agentListContainer.innerHTML = `<p style="font-size:0.78rem;color:var(--text-muted);padding:8px 0;">No agents online.</p>`;
    return;
  }

  agents.forEach(agent => {
    const isMe = agent.id === activeAgent?.id;
    const statusColors = { online: 'var(--success)', busy: 'var(--warning)', offline: 'var(--text-muted)' };
    const statusLabels = { online: '● Online', busy: '● Busy', offline: '○ Away' };
    const color = statusColors[agent.status] || 'var(--text-muted)';
    const label = statusLabels[agent.status] || '○ Away';
    const initial = (agent.name || '?').charAt(0).toUpperCase();

    const el = document.createElement('div');
    el.className = 'agent-list-item';
    el.innerHTML = `
      <div class="agent-list-avatar">${initial}</div>
      <span class="agent-list-name">${escapeHtml(agent.name)}${isMe ? ' <span style="color:var(--primary-light);font-size:0.68rem;">(You)</span>' : ''}</span>
      <span class="agent-list-status" style="color:${color}">${label}</span>
    `;
    agentListContainer.appendChild(el);
  });
}

// ══════════════════════════════════════════════
//  THREAD SELECTION & CHAT CONSOLE
// ══════════════════════════════════════════════

async function selectThread(id) {
  activeConversationId = id;
  renderSidebarThreads();

  chatPaneEmptyState.style.display = 'none';
  chatConsoleWrapper.style.display = 'flex';
  agentChatMessages.innerHTML = '';

  const convo = conversations.find(c => c.id === id);
  if (convo) updateActiveConvoState(convo);

  try {
    const res = await fetch(`/api/conversations/${id}/messages`);
    const history = await res.json();
    history.forEach(msg => {
      appendMessageBubble(msg.sender_type, msg.sender_name, msg.content, msg.created_at);
    });
    scrollToBottom();
  } catch (err) {
    console.error('Failed to load message history:', err);
  }
}

function updateActiveConvoState(convo) {
  // Right panel context
  contextEmptyLabel.style.display = 'none';
  contextWrapper.style.display    = 'block';

  ctxCustomerName.textContent = convo.customer_name || '—';
  ctxConvoId.textContent      = convo.id || '—';

  const statusLabel = getStatusLabel(convo.status, convo.assigned_agent_id);
  const chipClass   = getChipClass(convo.status, convo.assigned_agent_id);

  if (ctxStatusChip) {
    ctxStatusChip.textContent = statusLabel;
    ctxStatusChip.className   = `status-chip ${chipClass}`;
  } else {
    ctxConvoStatus.textContent = statusLabel.toUpperCase();
  }

  // Update center console header
  if (consoleCustomerName) consoleCustomerName.textContent = convo.customer_name || 'Customer';
  if (consoleConvoMeta)    consoleConvoMeta.textContent    = `#${convo.id.slice(0, 8)}… · ${statusLabel}`;
  if (consoleAvatarEl)     consoleAvatarEl.textContent     = (convo.customer_name || '?').charAt(0).toUpperCase();

  // Reset states
  claimBanner.style.display        = 'none';
  ctxFailoverAlert.style.display   = 'none';
  agentChatInput.removeAttribute('disabled');
  agentSendBtn.removeAttribute('disabled');
  transferToBotBtn.removeAttribute('disabled');
  closeTicketBtn.removeAttribute('disabled');

  if (convo.status === 'queued') {
    claimBanner.style.display      = 'flex';
    ctxFailoverAlert.style.display = 'flex';
    agentChatInput.setAttribute('disabled', 'true');
    agentSendBtn.setAttribute('disabled', 'true');
    transferToBotBtn.setAttribute('disabled', 'true');

  } else if (convo.status === 'agent' && convo.assigned_agent_id !== activeAgent?.id) {
    agentChatInput.setAttribute('disabled', 'true');
    agentSendBtn.setAttribute('disabled', 'true');
    transferToBotBtn.setAttribute('disabled', 'true');
    closeTicketBtn.setAttribute('disabled', 'true');

  } else if (convo.status === 'bot') {
    agentChatInput.setAttribute('disabled', 'true');
    agentSendBtn.setAttribute('disabled', 'true');

  } else if (convo.status === 'closed') {
    agentChatInput.setAttribute('disabled', 'true');
    agentSendBtn.setAttribute('disabled', 'true');
    transferToBotBtn.setAttribute('disabled', 'true');
    closeTicketBtn.setAttribute('disabled', 'true');
  }
}

// ══════════════════════════════════════════════
//  MESSAGE BUBBLE RENDERER
// ══════════════════════════════════════════════

let lastDateLabel = null;

function appendMessageBubble(senderType, senderName, content, timestamp) {
  const dt = new Date(timestamp);
  const dateLabel = dt.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr   = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Date divider
  if (dateLabel !== lastDateLabel) {
    lastDateLabel = dateLabel;
    const divider = document.createElement('div');
    divider.className = 'date-divider';
    divider.textContent = dateLabel;
    agentChatMessages.appendChild(divider);
  }

  const isToday = dt.toDateString() === new Date().toDateString();
  const formattedContent = content.replace(/\n/g, '<br>');

  // Sender label mapping
  const senderLabels = {
    customer: senderName || 'Customer',
    bot:      '🤖 AI Assistant',
    agent:    `👤 ${senderName || 'Agent'}`,
    system:   'System',
  };

  const el = document.createElement('div');
  el.className = `message ${senderType}`;
  el.innerHTML = `
    <span class="message-meta">
      ${escapeHtml(senderLabels[senderType] || senderType)}
      <span style="opacity:0.5">·</span>
      ${timeStr}
    </span>
    <div class="message-content">${formattedContent}</div>
  `;
  agentChatMessages.appendChild(el);
}

function scrollToBottom() {
  agentChatMessages.scrollTop = agentChatMessages.scrollHeight;
}

// ══════════════════════════════════════════════
//  AGENT ACTION HANDLERS
// ══════════════════════════════════════════════

claimConvoBtn.addEventListener('click', () => {
  if (!activeConversationId || !activeAgent) return;
  socket.emit('chat:claim', {
    conversationId: activeConversationId,
    agentId: activeAgent.id,
    agentName: activeAgent.name
  });
});

transferToBotBtn.addEventListener('click', () => {
  if (!activeConversationId) return;
  if (confirm('Return this conversation to AI Bot?')) {
    socket.emit('chat:transfer_to_bot', { conversationId: activeConversationId });
  }
});

closeTicketBtn.addEventListener('click', () => {
  if (!activeConversationId) return;
  if (confirm('Resolve and close this ticket?')) {
    socket.emit('chat:close', { conversationId: activeConversationId });
  }
});

agentChatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = agentChatInput.value.trim();
  if (!text || !activeConversationId) return;

  clearTimeout(typingTimeout);
  sendTypingStatus(false);

  socket.emit('message:send', {
    conversationId: activeConversationId,
    senderType: 'agent',
    senderName: activeAgent?.name || 'Agent',
    content: text
  });

  agentChatInput.value = '';
  agentChatInput.focus();
});

agentChatInput.addEventListener('input', () => {
  if (!isTyping) sendTypingStatus(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => sendTypingStatus(false), 1000);
});

function sendTypingStatus(state) {
  if (!activeConversationId) return;
  isTyping = state;
  socket.emit('message:typing', {
    conversationId: activeConversationId,
    senderType: 'agent',
    isTyping: state
  });
}

// ══════════════════════════════════════════════
//  SIDEBAR SEARCH & FILTER TABS
// ══════════════════════════════════════════════

if (threadSearch) {
  threadSearch.addEventListener('input', renderSidebarThreads);
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    renderSidebarThreads();
  });
});

// ══════════════════════════════════════════════
//  UTILITY HELPERS
// ══════════════════════════════════════════════

function getStatusLabel(status, assignedId) {
  if (status === 'agent') {
    return assignedId === activeAgent?.id ? 'Claimed by me' : 'Claimed';
  }
  const labels = { queued: 'Queued', bot: 'Bot', closed: 'Closed' };
  return labels[status] || status;
}

function getChipClass(status, assignedId) {
  if (status === 'agent') return 'chip-agent';
  const map = { queued: 'chip-queued', bot: 'chip-bot', closed: 'chip-closed' };
  return map[status] || '';
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#4f46e5)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

const db = require('./db');
require('dotenv').config();

// Active timers for conversations waiting for an agent.
// Key: conversationId (string), Value: { timeoutId: Timeout, expiresAt: timestamp }
const activeTimers = new Map();

// Default timeout is 2 minutes (120,000 ms)
const TIMEOUT_DURATION = parseInt(process.env.AUTO_REPLY_TIMEOUT_MS, 10) || 120000;

// Callback to trigger when a conversation times out waiting for an agent
let failoverCallback = null;

/**
 * Register the callback that gets executed on failover
 */
function registerFailoverCallback(callback) {
  failoverCallback = callback;
}

/**
 * Start or reset the failover timer for a conversation
 */
function startOrResetTimer(conversationId) {
  // If there's an existing timer, clear it first (resetting the 2-minute window)
  cancelTimer(conversationId);

  const expiresAt = Date.now() + TIMEOUT_DURATION;
  const timeoutId = setTimeout(async () => {
    activeTimers.delete(conversationId);
    console.log(`Timer fired: Conversation ${conversationId} timed out waiting for an agent.`);
    if (failoverCallback) {
      try {
        await failoverCallback(conversationId);
      } catch (err) {
        console.error(`Error in failover callback for conversation ${conversationId}:`, err);
      }
    }
  }, TIMEOUT_DURATION);

  activeTimers.set(conversationId, { timeoutId, expiresAt });
  console.log(`Scheduled agent reply failover timer for conversation ${conversationId} (Duration: ${TIMEOUT_DURATION}ms)`);
}

/**
 * Cancel the failover timer for a conversation
 */
function cancelTimer(conversationId) {
  if (activeTimers.has(conversationId)) {
    const timer = activeTimers.get(conversationId);
    clearTimeout(timer.timeoutId);
    activeTimers.delete(conversationId);
    console.log(`Cancelled failover timer for conversation ${conversationId}`);
  }
}

/**
 * Wrap DB functions
 */
async function createConversation(customerName, id = null) {
  return await db.createConversation(customerName, id);
}

async function getConversation(id) {
  return await db.getConversation(id);
}

async function updateConversationStatus(id, status, assignedAgentId = undefined) {
  const updatedConvo = await db.updateConversationStatus(id, status, assignedAgentId);

  // If the state changes to 'agent' or 'closed', we must cancel the timer.
  if (status === 'agent' || status === 'closed' || status === 'bot') {
    cancelTimer(id);
  } else if (status === 'queued') {
    // If it goes to queued, start the timer
    startOrResetTimer(id);
  }

  return updatedConvo;
}

async function getMessages(conversationId) {
  return await db.getMessages(conversationId);
}

async function addMessage(conversationId, senderType, senderName, content) {
  const message = await db.addMessage(conversationId, senderType, senderName, content);

  // If the customer sends a message while the status is 'queued', reset the timer
  const convo = await db.getConversation(conversationId);
  if (convo && convo.status === 'queued' && senderType === 'customer') {
    startOrResetTimer(conversationId);
  }

  // If an agent sends a message, cancel the timer (agent replied!)
  if (convo && senderType === 'agent') {
    cancelTimer(conversationId);
  }

  return message;
}

async function getActiveConversations() {
  return await db.getActiveConversations();
}

async function getQueuedConversations() {
  return await db.getQueuedConversations();
}

module.exports = {
  registerFailoverCallback,
  startOrResetTimer,
  cancelTimer,
  createConversation,
  getConversation,
  updateConversationStatus,
  getMessages,
  addMessage,
  getActiveConversations,
  getQueuedConversations
};

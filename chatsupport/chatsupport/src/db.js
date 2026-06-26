const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isInMemoryMode = true;

// In-memory fallback database
const memoryDb = {
  conversations: {},
  messages: {} // Keyed by conversationId: array of message objects
};

if (supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== "" && supabaseAnonKey.trim() !== "") {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isInMemoryMode = false;
    console.log('Successfully connected to Supabase Database.');
  } catch (error) {
    console.error('Failed to initialize Supabase client. Defaulting to in-memory mode.', error);
  }
} else {
  console.warn('⚠️ WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is not defined in .env. Running in LOCAL IN-MEMORY mode.');
}

/**
 * Creates a new conversation
 */
async function createConversation(customerName, customId = null) {
  const id = customId || crypto.randomUUID();
  const now = new Date().toISOString();

  if (isInMemoryMode) {
    const conversation = {
      id,
      customer_name: customerName,
      status: 'bot',
      assigned_agent_id: null,
      created_at: now,
      updated_at: now
    };
    memoryDb.conversations[id] = conversation;
    memoryDb.messages[id] = [];
    return conversation;
  } else {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ id, customer_name: customerName, status: 'bot', assigned_agent_id: null }])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation in Supabase:', error);
      throw error;
    }
    return data;
  }
}

/**
 * Retrieves a conversation by its ID
 */
async function getConversation(id) {
  if (isInMemoryMode) {
    return memoryDb.conversations[id] || null;
  } else {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching conversation from Supabase:', error);
      throw error;
    }
    return data;
  }
}

/**
 * Updates status and/or agent assignment of a conversation
 */
async function updateConversationStatus(id, status, assignedAgentId = undefined) {
  const now = new Date().toISOString();

  if (isInMemoryMode) {
    const convo = memoryDb.conversations[id];
    if (!convo) return null;
    
    convo.status = status;
    if (assignedAgentId !== undefined) {
      convo.assigned_agent_id = assignedAgentId;
    }
    convo.updated_at = now;
    return convo;
  } else {
    const updatePayload = { status, updated_at: now };
    if (assignedAgentId !== undefined) {
      updatePayload.assigned_agent_id = assignedAgentId;
    }

    const { data, error } = await supabase
      .from('conversations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation in Supabase:', error);
      throw error;
    }
    return data;
  }
}

/**
 * Gets all message logs for a specific conversation
 */
async function getMessages(conversationId) {
  if (isInMemoryMode) {
    return memoryDb.messages[conversationId] || [];
  } else {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages from Supabase:', error);
      throw error;
    }
    return data;
  }
}

/**
 * Logs a message in a conversation thread
 */
async function addMessage(conversationId, senderType, senderName, content) {
  const now = new Date().toISOString();

  if (isInMemoryMode) {
    const message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_type: senderType,
      sender_name: senderName,
      content,
      created_at: now
    };
    if (!memoryDb.messages[conversationId]) {
      memoryDb.messages[conversationId] = [];
    }
    memoryDb.messages[conversationId].push(message);
    
    // Update updated_at for conversation
    if (memoryDb.conversations[conversationId]) {
      memoryDb.conversations[conversationId].updated_at = now;
    }
    return message;
  } else {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_type: senderType,
        sender_name: senderName,
        content
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding message in Supabase:', error);
      throw error;
    }

    // Touch the conversation updated_at column
    await supabase
      .from('conversations')
      .update({ updated_at: now })
      .eq('id', conversationId);

    return data;
  }
}

/**
 * Retrieves all conversations that are not closed
 */
async function getActiveConversations() {
  if (isInMemoryMode) {
    return Object.values(memoryDb.conversations).filter(c => c.status !== 'closed');
  } else {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .neq('status', 'closed')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching active conversations from Supabase:', error);
      throw error;
    }
    return data;
  }
}

/**
 * Retrieves all conversations currently waiting for an agent
 */
async function getQueuedConversations() {
  if (isInMemoryMode) {
    return Object.values(memoryDb.conversations).filter(c => c.status === 'queued');
  } else {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching queued conversations from Supabase:', error);
      throw error;
    }
    return data;
  }
}

module.exports = {
  isInMemoryMode: () => isInMemoryMode,
  createConversation,
  getConversation,
  updateConversationStatus,
  getMessages,
  addMessage,
  getActiveConversations,
  getQueuedConversations
};

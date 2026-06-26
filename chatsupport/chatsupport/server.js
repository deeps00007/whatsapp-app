const express = require('express');
const http = require('http');
const path = require('path');
const socketHandler = require('./src/socketHandler');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Basic status API check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    mode: require('./src/db').isInMemoryMode() ? 'in-memory' : 'supabase'
  });
});

// Get messages for a specific conversation
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const convoManager = require('./src/conversationManager');
    const messages = await convoManager.getMessages(req.params.id);
    res.json(messages);
  } catch (err) {
    console.error('REST Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get detailed status of a specific conversation
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const convoManager = require('./src/conversationManager');
    const convo = await convoManager.getConversation(req.params.id);
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(convo);
  } catch (err) {
    console.error('REST Error fetching conversation details:', err);
    res.status(500).json({ error: 'Failed to fetch conversation details' });
  }
});

// Bind Socket.io real-time handler
socketHandler.init(server);

// Boot server
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Chat Support API Server successfully booted.`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`🤖 Auto-reply failover timeout: ${process.env.AUTO_REPLY_TIMEOUT_MS || 120000}ms`);
  console.log(`==================================================`);
});

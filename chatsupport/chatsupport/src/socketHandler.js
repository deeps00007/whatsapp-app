const socketIO = require('socket.io');
const convoManager = require('./conversationManager');
const botEngine = require('./botEngine');
const agentSystem = require('./agentSystem');

let ioInstance = null;

function init(server) {
  const io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  ioInstance = io;

  // Register the failover callback for the 2-minute agent reply timeout
  convoManager.registerFailoverCallback(async (conversationId) => {
    const convo = await convoManager.getConversation(conversationId);
    if (!convo || convo.status !== 'queued') return;

    // Send a typing indicator to the customer for realism
    io.to(conversationId).emit('message:typing', { senderType: 'bot', isTyping: true });

    // Generate response using Sarvam AI
    const aiResponse = await botEngine.generateSarvamAIResponse(conversationId);

    // Save message to database
    const botMsg = await convoManager.addMessage(conversationId, 'bot', 'Support Bot (AI)', aiResponse);

    // Send reply and turn off typing indicator
    io.to(conversationId).emit('message:typing', { senderType: 'bot', isTyping: false });
    io.to(conversationId).emit('message:receive', botMsg);

    // Broadcast the update to the agents so they see the bot message in the queue list
    await broadcastQueueUpdate();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] New connection established: ${socket.id}`);

    // --- CUSTOMER JOIN CHAT ---
    socket.on('customer:join', async ({ conversationId, customerName }) => {
      socket.join(conversationId);
      socket.conversationId = conversationId;
      socket.role = 'customer';
      socket.customerName = customerName;
      console.log(`[Socket] Customer "${customerName}" joined room: ${conversationId}`);

      try {
        // Fetch or create conversation
        let convo = await convoManager.getConversation(conversationId);
        if (!convo) {
          convo = await convoManager.createConversation(customerName, conversationId);
          // Initial greeting by Bot
          const welcomeResponse = botEngine.getMenuResponse('');
          const welcomeMsg = await convoManager.addMessage(conversationId, 'bot', 'Support Bot', welcomeResponse.content);
          io.to(conversationId).emit('message:receive', welcomeMsg);
        }

        // Send conversation history to client
        const history = await convoManager.getMessages(conversationId);
        socket.emit('conversation:history', { conversation: convo, messages: history });
      } catch (err) {
        console.error('Error handling customer:join event:', err);
      }
    });

    // --- AGENT JOIN DASHBOARD ---
    socket.on('agent:join', async ({ agentId, agentName }) => {
      socket.join('agents');
      socket.agentId = agentId;
      socket.role = 'agent';
      socket.agentName = agentName;

      // Register agent in active state list
      agentSystem.registerAgent(agentId, agentName, socket.id);

      console.log(`[Socket] Agent "${agentName}" joined admin workspace.`);

      // Broadcast active agents update to all agents
      io.to('agents').emit('agents:update', agentSystem.getAllAgents());

      // Send initial queue data to the newly connected agent
      await sendQueueUpdateToSocket(socket);
    });

    // --- AGENT STATUS UPDATE ---
    socket.on('agent:status_change', ({ agentId, status }) => {
      agentSystem.updateAgentStatus(agentId, status);
      io.to('agents').emit('agents:update', agentSystem.getAllAgents());
    });

    // --- MESSAGE TRANSMISSION ---
    socket.on('message:send', async ({ conversationId, senderType, senderName, content }) => {
      try {
        // Save the incoming user message to database
        const clientMsg = await convoManager.addMessage(conversationId, senderType, senderName, content);
        
        // Broadcast the client's message to everyone in the room
        io.to(conversationId).emit('message:receive', clientMsg);

        // Fetch current conversation state
        const convo = await convoManager.getConversation(conversationId);
        if (!convo) return;

        // Broadcast active queue updates to agents since a new message is received
        await broadcastQueueUpdate();

        // BOT STATE AUTOMATIONS
        if (convo.status === 'bot' && senderType === 'customer') {
          // Send typing indicator
          io.to(conversationId).emit('message:typing', { senderType: 'bot', isTyping: true });

          // Mock delay for natural response feel
          setTimeout(async () => {
            const botResponse = botEngine.getMenuResponse(content);
            
            const botMsg = await convoManager.addMessage(conversationId, 'bot', 'Support Bot', botResponse.content);
            io.to(conversationId).emit('message:typing', { senderType: 'bot', isTyping: false });
            io.to(conversationId).emit('message:receive', botMsg);

            if (botResponse.toQueue) {
              // Transition conversation state to queued
              await convoManager.updateConversationStatus(conversationId, 'queued');
              
              // Broadcast system message indicating queue entry
              const sysMsg = await convoManager.addMessage(
                conversationId, 
                'system', 
                'System', 
                'Conversation placed in the support queue. Waiting for an agent...'
              );
              io.to(conversationId).emit('message:receive', sysMsg);

              // Broadcast new queue telemetry data to agents
              await broadcastQueueUpdate();
            }
          }, 1000);
        }
      } catch (err) {
        console.error('Error handling message:send:', err);
      }
    });

    // --- TYPING INDICATORS ---
    socket.on('message:typing', ({ conversationId, senderType, isTyping }) => {
      // Broadcast typing indicator to other parties in the conversation room
      socket.to(conversationId).emit('message:typing', { senderType, isTyping });
    });

    // --- AGENT CLAIM CHAT ---
    socket.on('chat:claim', async ({ conversationId, agentId, agentName }) => {
      try {
        console.log(`[Socket] Agent ${agentName} claiming chat: ${conversationId}`);
        
        // Update database and cancel failover timer
        await convoManager.updateConversationStatus(conversationId, 'agent', agentId);

        // Make the agent's socket join this conversation room
        socket.join(conversationId);

        // Add a system log message
        const claimMsg = await convoManager.addMessage(
          conversationId,
          'system',
          'System',
          `Agent ${agentName} has joined the conversation.`
        );

        // Emit the join message and update to room
        io.to(conversationId).emit('message:receive', claimMsg);
        
        // Refresh conversation metadata for clients
        const convo = await convoManager.getConversation(conversationId);
        io.to(conversationId).emit('conversation:status_change', convo);

        // Broadcast updated queue dashboard lists to all agents
        await broadcastQueueUpdate();
      } catch (err) {
        console.error('Error claiming chat:', err);
      }
    });

    // --- AGENT TRANSFER TO BOT ---
    socket.on('chat:transfer_to_bot', async ({ conversationId }) => {
      try {
        console.log(`[Socket] Transferring chat ${conversationId} back to Support Bot.`);
        
        await convoManager.updateConversationStatus(conversationId, 'bot', null);

        const sysMsg = await convoManager.addMessage(
          conversationId,
          'system',
          'System',
          'Conversation has been transferred back to the automated Support Bot.'
        );
        io.to(conversationId).emit('message:receive', sysMsg);

        const convo = await convoManager.getConversation(conversationId);
        io.to(conversationId).emit('conversation:status_change', convo);

        await broadcastQueueUpdate();
      } catch (err) {
        console.error('Error transferring chat to bot:', err);
      }
    });

    // --- AGENT CLOSE CHAT ---
    socket.on('chat:close', async ({ conversationId }) => {
      try {
        console.log(`[Socket] Closing chat: ${conversationId}`);
        
        await convoManager.updateConversationStatus(conversationId, 'closed');

        const sysMsg = await convoManager.addMessage(
          conversationId,
          'system',
          'System',
          'The support session has been marked as closed.'
        );
        io.to(conversationId).emit('message:receive', sysMsg);

        const convo = await convoManager.getConversation(conversationId);
        io.to(conversationId).emit('conversation:status_change', convo);

        await broadcastQueueUpdate();
      } catch (err) {
        console.error('Error closing chat:', err);
      }
    });

    // --- ON DISCONNECT ---
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (socket.role === 'agent') {
        agentSystem.unregisterAgent(socket.agentId);
        io.to('agents').emit('agents:update', agentSystem.getAllAgents());
      }
    });
  });
}

/**
 * Sends complete list of active and queued conversations to a specific agent socket
 */
async function sendQueueUpdateToSocket(socket) {
  try {
    const allActive = await convoManager.getActiveConversations();
    socket.emit('queue:data', allActive);
  } catch (err) {
    console.error('Error sending queue updates:', err);
  }
}

// Global hook to trigger queue broadcasts from controllers
async function broadcastQueueUpdate() {
  if (ioInstance) {
    try {
      const allActive = await convoManager.getActiveConversations();
      ioInstance.to('agents').emit('queue:data', allActive);
    } catch (err) {
      console.error('Error broadcasting queue data:', err);
    }
  }
}

module.exports = {
  init,
  broadcastQueueUpdate
};

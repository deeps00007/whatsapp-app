const db = require('./db');
require('dotenv').config();

const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

/**
 * Normal bot reply generator (Rule-based menu)
 */
function getMenuResponse(input) {
  const normalized = input.trim().toLowerCase();

  // If input is empty (e.g. customer joins first time, welcome menu)
  if (normalized === '') {
    return {
      content: "👋 Hello! Welcome to Support. I am your Chatbot Assistant. How can I help you today? Please choose an option:\n\n" +
               "1️⃣ **Business Hours & Location**\n" +
               "2️⃣ **Order & Billing Questions**\n" +
               "3️⃣ **Tech Support Troubleshooting**\n" +
               "4️⃣ **Connect with a Live Agent**\n\n" +
               "*(You can also just type 'agent' at any time to queue for a human)*",
      toQueue: false
    };
  }

  // Option 1
  if (normalized.includes('business hours') || normalized.includes('hours') || normalized.includes('location')) {
    return {
      content: "🕒 **Business Hours:** Monday to Friday, 9:00 AM - 6:00 PM EST.\n📍 **Location:** Tech Hub City, CA.",
      toQueue: false
    };
  }
  
  // Option 2
  if (normalized.includes('billing & orders') || normalized.includes('billing') || normalized.includes('order')) {
    return {
      content: "💳 **Billing & Orders:** For payment issues or refund status, please provide your Invoice ID. You can also transfer to a live representative by typing **'agent'**.",
      toQueue: false
    };
  }

  // Option 3
  if (normalized.includes('technical help') || normalized.includes('technical') || normalized.includes('trouble')) {
    return {
      content: "💻 **Technical Support:** Please describe the issue you are experiencing. Have you tried resetting the app? Type **'agent'** if you want to request a technician.",
      toQueue: false
    };
  }

  // Anything else: immediately route to queue with human confirmation!
  return {
    content: "🤝 **Connecting you to a human agent...** Please hold. If no agents are available within 2 minutes, our AI assistant will step in to answer your queries.",
    toQueue: true
  };
}

/**
 * Uses Sarvam AI API to analyze historical context and reply to the customer's query
 */
async function generateSarvamAIResponse(conversationId, convoStatus = 'queued') {
  const apiKey = process.env.SARVAM_API_KEY || 'sk_u88hdag6_q8T4oXwuAH9CeYc5wUfqSY6Q';
  const modelName = process.env.SARVAM_MODEL || 'sarvam-30b';

  console.log(`Generating automated Sarvam AI response for Conversation: ${conversationId} (Status: ${convoStatus}) using model ${modelName}...`);

  try {
    // 1. Fetch message history for context
    const messages = await db.getMessages(conversationId);
    
    if (messages.length === 0) {
      return "Hello! I am an AI assistant. How can I assist you today?";
    }

    // 2. Format history for OpenAI-compatible payload
    let systemPromptContent = '';
    if (convoStatus === 'bot') {
      systemPromptContent = 'You are a helpful automated AI customer support assistant. You are replying to the customer in real-time. Keep the answer extremely helpful, polite, and under 3-4 sentences. Mention that if they want to speak with a human agent, they can type "agent" at any time.';
    } else {
      systemPromptContent = 'You are an automated fallback AI customer support assistant. The customer has requested to speak to a human agent, but all agents are currently offline or busy. In the meantime, you must analyze their question and answer it as best as you can. Keep the answer extremely helpful, polite, and under 3-4 sentences. Clearly remind the customer that they are still in the queue and an agent will join as soon as they are online.';
    }

    const systemPrompt = {
      role: 'system',
      content: systemPromptContent
    };

    const formattedMessages = [systemPrompt];

    // Append last 8 messages (to prevent context window bloat) for conversation context
    const recentMessages = messages.slice(-8);
    recentMessages.forEach(msg => {
      let role = 'user';
      if (msg.sender_type === 'bot' || msg.sender_type === 'agent') {
        role = 'assistant';
      } else if (msg.sender_type === 'system') {
        // Skip system log messages
        return;
      }
      formattedMessages.push({
        role,
        content: msg.content
      });
    });

    console.log(`Sending payload with ${formattedMessages.length} messages to Sarvam AI...`);

    // 3. Make fetch call
    const response = await fetch(SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam API error (Status: ${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully received response from Sarvam AI.');

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.warn('Sarvam response structure unexpected:', JSON.stringify(data));
      return "All of our agents are busy right now, but your query remains in the queue. An agent will connect shortly!";
    }

  } catch (error) {
    console.error('Sarvam AI API request failed:', error);
    // Fallback response so user doesn't get left with silence
    return "💡 *AI Fallback Response:* All of our human agents are currently assisting other customers. Your place in the queue is secured. Please describe your issue in detail so the agent can help you immediately upon connection!";
  }
}

module.exports = {
  getMenuResponse,
  generateSarvamAIResponse
};

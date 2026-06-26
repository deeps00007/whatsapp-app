// In-memory agent registry
const activeAgents = new Map(); // Key: agentId, Value: { id, name, status, socketId }

/**
 * Register a new agent
 */
function registerAgent(agentId, name, socketId) {
  const agent = {
    id: agentId,
    name,
    status: 'online',
    socketId
  };
  activeAgents.set(agentId, agent);
  console.log(`[AgentSystem] Agent Registered: ${name} (${agentId})`);
  return agent;
}

/**
 * Unregister an agent
 */
function unregisterAgent(agentId) {
  if (activeAgents.has(agentId)) {
    const agent = activeAgents.get(agentId);
    activeAgents.delete(agentId);
    console.log(`[AgentSystem] Agent Unregistered: ${agent.name} (${agentId})`);
    return agent;
  }
  return null;
}

/**
 * Update the status of an agent
 */
function updateAgentStatus(agentId, status) {
  if (activeAgents.has(agentId)) {
    const agent = activeAgents.get(agentId);
    agent.status = status; // 'online', 'busy', 'offline'
    console.log(`[AgentSystem] Agent ${agent.name} status updated to: ${status}`);
    return agent;
  }
  return null;
}

/**
 * Retrieve an agent by their ID
 */
function getAgent(agentId) {
  return activeAgents.get(agentId) || null;
}

/**
 * Find agent by their active Socket ID
 */
function getAgentBySocketId(socketId) {
  for (const agent of activeAgents.values()) {
    if (agent.socketId === socketId) {
      return agent;
    }
  }
  return null;
}

/**
 * Return all registered agents
 */
function getAllAgents() {
  return Array.from(activeAgents.values());
}

module.exports = {
  registerAgent,
  unregisterAgent,
  updateAgentStatus,
  getAgent,
  getAgentBySocketId,
  getAllAgents
};

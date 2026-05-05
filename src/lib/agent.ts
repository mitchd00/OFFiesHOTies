import { AGENTS, type Agent, agentById } from './types';

const KEY = 'offies-hoties:agent-id';

export function getCurrentAgent(): Agent | null {
  const id = localStorage.getItem(KEY);
  if (!id) return null;
  return agentById(id) ?? null;
}

export function setCurrentAgent(id: string): Agent {
  const agent = agentById(id);
  if (!agent) throw new Error(`Unknown agent id: ${id}`);
  localStorage.setItem(KEY, id);
  return agent;
}

export function clearCurrentAgent(): void {
  localStorage.removeItem(KEY);
}

export function listAgents(): Agent[] {
  return AGENTS;
}

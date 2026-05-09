export type Role = 'agent' | 'director';

export interface Agent {
  id: string;
  name: string;
  role: Role;
}

export interface PropertyData {
  street: string;
  suburb: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

export interface Offie {
  id: string;
  property: PropertyData;
  price_guide: string | null;
  situation: string;
  notes: string | null;
  agent_id: string;
  agent_name: string;
  created_at: string;
  updated_at: string;
}

export interface Hotie {
  id: string;
  buyer_name: string;
  suburb_focus: string[];
  budget_band: string;
  brief: string | null;
  agent_id: string;
  agent_name: string;
  created_at: string;
  updated_at: string;
}

export interface RecycleBinEntry {
  type: 'offie' | 'hotie';
  id: string;
  preview: string;
  deleted_at: string;
  deleted_by: string;
  deleted_by_name: string;
}

export const AGENTS: Agent[] = [
  { id: 'mitch-lund', name: 'Mitch Lund', role: 'director' },
  { id: 'jordan-lund', name: 'Jordan Lund', role: 'director' },
  { id: 'minka-jenkins', name: 'Minka Jenkins', role: 'agent' },
  { id: 'neill-vissor', name: 'Neill Vissor', role: 'agent' },
  { id: 'justin-fitzgibbon', name: 'Justin Fitzgibbon', role: 'agent' },
  { id: 'julie-coffee', name: 'Julie Coffee', role: 'agent' },
  { id: 'julie-young', name: 'Julie Young', role: 'agent' },
];

export function agentById(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

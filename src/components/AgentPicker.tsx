import { listAgents, setCurrentAgent } from '@/lib/agent';
import type { Agent } from '@/lib/types';

interface Props {
  onPick: (agent: Agent) => void;
}

export function AgentPicker({ onPick }: Props) {
  const agents = listAgents();
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-bg-light">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-text-light">ELITE</p>
          <h1 className="text-xl font-semibold text-brand-black">Who is using this device</h1>
          <p className="text-sm text-text-light">Pick your name to continue.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {agents.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                const picked = setCurrentAgent(a.id);
                onPick(picked);
              }}
              className="card p-4 text-left hover:border-gold transition"
            >
              <span className="block font-medium text-brand-black">{a.name}</span>
              <span className="text-xs text-text-light capitalize">{a.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { PinGate } from '@/components/PinGate';
import { AgentPicker } from '@/components/AgentPicker';
import { Home } from '@/pages/Home';
import { RecycleBin } from '@/pages/RecycleBin';
import { ToastProvider } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { getCurrentAgent, clearCurrentAgent } from '@/lib/agent';
import type { Agent, Role } from '@/lib/types';

type Stage = 'loading' | 'pin' | 'agent' | 'ready';

interface RouteDef {
  path: string;
  element: React.ReactNode;
  visibleTo: Role[];
}

export default function App() {
  const [stage, setStage] = useState<Stage>('loading');
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.pin.check().then((r) => {
      if (cancelled) return;
      if (!r.ok) { setStage('pin'); return; }
      const a = getCurrentAgent();
      if (!a) { setStage('agent'); return; }
      setAgent(a);
      setStage('ready');
    }).catch(() => { if (!cancelled) setStage('pin'); });
    return () => { cancelled = true; };
  }, []);

  if (stage === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-text-light">Loading</div>;
  }

  if (stage === 'pin') {
    return (
      <ToastProvider>
        <PinGate
          onUnlock={() => {
            const a = getCurrentAgent();
            if (!a) setStage('agent');
            else { setAgent(a); setStage('ready'); }
          }}
        />
      </ToastProvider>
    );
  }

  if (stage === 'agent' || !agent) {
    return (
      <ToastProvider>
        <AgentPicker onPick={(a) => { setAgent(a); setStage('ready'); }} />
      </ToastProvider>
    );
  }

  const routes: RouteDef[] = [
    { path: '/', element: <Home agent={agent} onSwitchAgent={() => { clearCurrentAgent(); setAgent(null); setStage('agent'); }} />, visibleTo: ['agent', 'director'] },
    { path: '/recycle-bin', element: <RecycleBin agent={agent} />, visibleTo: ['director'] },
  ];

  const visible = routes.filter((r) => r.visibleTo.includes(agent.role));

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {visible.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, LogOut } from 'lucide-react';
import { SuburbPills } from '@/components/SuburbPills';
import { BoardHeader } from '@/components/BoardHeader';
import { OffieCard } from '@/components/OffieCard';
import { HotieCard } from '@/components/HotieCard';
import { AddOffieModal } from '@/components/AddOffieModal';
import { AddHotieModal } from '@/components/AddHotieModal';
import { FloatingAdd } from '@/components/FloatingAdd';
import { api } from '@/lib/api';
import type { Offie, Hotie, Agent } from '@/lib/types';
import type { Cluster } from '@/lib/suburbs';
import { useToast } from '@/components/ui/Toast';

interface Props {
  agent: Agent;
  onSwitchAgent: () => void;
}

export function Home({ agent, onSwitchAgent }: Props) {
  const [cluster, setCluster] = useState<Cluster>('all');
  const [offies, setOffies] = useState<Offie[]>([]);
  const [hoties, setHoties] = useState<Hotie[]>([]);
  const [loading, setLoading] = useState(true);
  const [offieOpen, setOffieOpen] = useState(false);
  const [hotieOpen, setHotieOpen] = useState(false);
  const [editingOffie, setEditingOffie] = useState<Offie | null>(null);
  const [editingHotie, setEditingHotie] = useState<Hotie | null>(null);
  const toast = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [o, h] = await Promise.all([api.offies.list(cluster), api.hoties.list(cluster)]);
      setOffies(o);
      setHoties(h);
    } finally {
      setLoading(false);
    }
  }, [cluster]);

  useEffect(() => { reload(); }, [reload]);

  async function refreshOffie(id: string) {
    await api.offies.refresh(id);
    toast.show('Refreshed');
    reload();
  }
  async function refreshHotie(id: string) {
    await api.hoties.refresh(id);
    toast.show('Refreshed');
    reload();
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-20 bg-bg-light/95 backdrop-blur border-b border-divider">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-text-light">ELITE</p>
            <h1 className="text-base font-semibold text-brand-black">OFFies and HOTies</h1>
          </div>
          <div className="flex items-center gap-1">
            {agent.role === 'director' && (
              <Link
                to="/recycle-bin"
                className="p-2 text-text-light hover:text-brand-black"
                aria-label="Recycle bin"
                title="Recycle bin"
              >
                <Archive size={18} />
              </Link>
            )}
            <button
              type="button"
              onClick={onSwitchAgent}
              className="p-2 text-text-light hover:text-brand-black"
              aria-label="Switch agent"
              title={`${agent.name} - switch agent`}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <SuburbPills value={cluster} onChange={setCluster} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-8">
        <section>
          <BoardHeader title="OFFies" count={offies.length} />
          {loading ? (
            <p className="text-sm text-text-light">Loading</p>
          ) : offies.length === 0 ? (
            <p className="text-sm text-text-light">No off-market opportunities yet.</p>
          ) : (
            <div className="space-y-3">
              {offies.map((o) => (
                <OffieCard
                  key={o.id}
                  offie={o}
                  onEdit={() => { setEditingOffie(o); setOffieOpen(true); }}
                  onRefresh={() => refreshOffie(o.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <BoardHeader title="HOTies" count={hoties.length} />
          {loading ? (
            <p className="text-sm text-text-light">Loading</p>
          ) : hoties.length === 0 ? (
            <p className="text-sm text-text-light">No active buyers registered yet.</p>
          ) : (
            <div className="space-y-3">
              {hoties.map((h) => (
                <HotieCard
                  key={h.id}
                  hotie={h}
                  onEdit={() => { setEditingHotie(h); setHotieOpen(true); }}
                  onRefresh={() => refreshHotie(h.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <FloatingAdd
        onPickOffie={() => { setEditingOffie(null); setOffieOpen(true); }}
        onPickHotie={() => { setEditingHotie(null); setHotieOpen(true); }}
      />

      <AddOffieModal
        open={offieOpen}
        onOpenChange={setOffieOpen}
        currentAgent={agent}
        initial={editingOffie}
        onSaved={reload}
        onDeleted={reload}
      />
      <AddHotieModal
        open={hotieOpen}
        onOpenChange={setHotieOpen}
        currentAgent={agent}
        initial={editingHotie}
        onSaved={reload}
        onDeleted={reload}
      />
    </div>
  );
}

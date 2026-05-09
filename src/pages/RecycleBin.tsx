import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Agent, RecycleBinEntry } from '@/lib/types';

interface Props {
  agent: Agent;
}

export function RecycleBin({ agent }: Props) {
  const [entries, setEntries] = useState<RecycleBinEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await api.recycleBin.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (agent.role !== 'director') return <Navigate to="/" replace />;

  async function restore(e: RecycleBinEntry) {
    await api.recycleBin.restore(e.type, e.id);
    toast.show('Restored');
    reload();
  }

  async function purge(e: RecycleBinEntry) {
    const ok = window.confirm('Permanently remove this entry. This cannot be undone.');
    if (!ok) return;
    await api.recycleBin.purge(e.type, e.id);
    toast.show('Removed');
    reload();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-bg-light/95 backdrop-blur border-b border-divider">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 -m-2 text-text-light hover:text-brand-black" aria-label="Back">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-text-light">Director only</p>
            <h1 className="text-base font-semibold text-brand-black">Recycle bin</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-text-light">Loading</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-text-light">Nothing in the bin.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li key={`${e.type}-${e.id}`} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-text-light">{e.type === 'offie' ? 'OFFie' : 'HOTie'}</p>
                    <p className="font-medium text-brand-black truncate">{e.preview}</p>
                    <p className="text-xs text-text-light mt-1">
                      Deleted by {e.deleted_by_name ?? e.deleted_by} on {formatDate(e.deleted_at)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="secondary" onClick={() => restore(e)}>Restore</Button>
                    <Button variant="danger" onClick={() => purge(e)}>Purge</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

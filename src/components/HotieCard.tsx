import { useState } from 'react';
import { Copy, Edit2, RefreshCw } from 'lucide-react';
import type { Hotie } from '@/lib/types';
import { budgetBandLabel } from '@/lib/enums';
import { isStale, formatRelative } from '@/lib/format';
import { hotieBlurb, copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/cn';
import { useToast } from './ui/Toast';

interface Props {
  hotie: Hotie;
  onEdit: () => void;
  onRefresh: () => void;
}

export function HotieCard({ hotie, onEdit, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);
  const stale = isStale(hotie.updated_at);
  const toast = useToast();

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    await copyToClipboard(hotieBlurb(hotie));
    toast.show('Copied');
  }

  return (
    <article
      className={cn('card border-l-4 border-l-sand p-4', stale && 'stale')}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-brand-black truncate">{hotie.buyer_name}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {hotie.suburb_focus.map((s) => (
              <span key={s} className="chip text-xs py-0.5 px-2">{s}</span>
            ))}
          </div>
          <p className="mt-2 text-sm font-medium text-brand-black">{budgetBandLabel(hotie.budget_band)}</p>
          {hotie.brief && !expanded && (
            <p className="mt-1 text-sm text-text-light line-clamp-2">{hotie.brief}</p>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Send to vendor"
            title="Send to vendor"
            className="p-2 text-text-light hover:text-brand-black"
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            aria-label="Edit"
            title="Edit"
            className="p-2 text-text-light hover:text-brand-black"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>
      {expanded && hotie.brief && (
        <p className="mt-3 pt-3 border-t border-divider text-sm text-text-dark whitespace-pre-wrap">
          {hotie.brief}
        </p>
      )}
      <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between text-xs text-text-light">
        <span>{hotie.agent_name} · {formatRelative(hotie.updated_at)}</span>
        {stale && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
            aria-label="Refresh"
            title="Refresh"
            className="p-1 -m-1 text-gold hover:text-brand-black"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    </article>
  );
}

import { useState } from 'react';
import { Copy, Edit2, RefreshCw } from 'lucide-react';
import type { Offie } from '@/lib/types';
import { situationLabel } from '@/lib/enums';
import { isStale, formatRelative } from '@/lib/format';
import { offieBlurb, copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/cn';
import { useToast } from './ui/Toast';

interface Props {
  offie: Offie;
  onEdit: () => void;
  onRefresh: () => void;
}

export function OffieCard({ offie, onEdit, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);
  const stale = isStale(offie.updated_at);
  const toast = useToast();

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    await copyToClipboard(offieBlurb(offie));
    toast.show('Copied');
  }

  return (
    <article
      className={cn('card border-l-4 border-l-gold p-4', stale && 'stale')}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-brand-black truncate">{offie.property.street}</h3>
          <p className="text-sm text-text-dark">{offie.property.suburb}</p>
          {offie.price_guide && (
            <p className="mt-1 text-sm font-medium text-brand-black">{offie.price_guide}</p>
          )}
          <span className="mt-2 inline-block text-xs text-text-light">{situationLabel(offie.situation)}</span>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Pitch to buyer"
            title="Pitch to buyer"
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
      {expanded && offie.notes && (
        <p className="mt-3 pt-3 border-t border-divider text-sm text-text-dark whitespace-pre-wrap">
          {offie.notes}
        </p>
      )}
      <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between text-xs text-text-light">
        <span>{offie.agent_name} · {formatRelative(offie.updated_at)}</span>
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

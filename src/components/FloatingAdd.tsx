import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  onPickOffie: () => void;
  onPickHotie: () => void;
}

export function FloatingAdd({ onPickOffie, onPickHotie }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => { setOpen(false); onPickOffie(); }}
            className="card px-4 py-2 text-sm font-medium border-l-4 border-l-gold"
          >
            Add OFFie
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onPickHotie(); }}
            className="card px-4 py-2 text-sm font-medium border-l-4 border-l-sand"
          >
            Add HOTie
          </button>
        </div>
      )}
      <button
        type="button"
        aria-label="Add"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-card transition',
          'bg-brand-black text-white active:bg-gold',
        )}
      >
        <Plus size={24} className={cn(open && 'rotate-45 transition-transform')} />
      </button>
    </div>
  );
}

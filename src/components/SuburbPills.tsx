import { cn } from '@/lib/cn';
import type { Cluster } from '@/lib/suburbs';

const OPTIONS: { value: Cluster; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'caloundra', label: 'Caloundra side' },
  { value: 'kawana', label: 'Kawana side' },
];

interface Props {
  value: Cluster;
  onChange: (cluster: Cluster) => void;
}

export function SuburbPills({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn('chip whitespace-nowrap', active && 'chip-active')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

import { cn } from '@/lib/cn';

export interface ChipOption {
  value: string;
  label: string;
}

interface SingleProps {
  options: readonly ChipOption[];
  value: string | null;
  onChange: (value: string) => void;
  multi?: false;
}
interface MultiProps {
  options: readonly ChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
  multi: true;
}

type Props = SingleProps | MultiProps;

export function ChipSelect(props: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.options.map((opt) => {
        const active = props.multi
          ? (props.value as string[]).includes(opt.value)
          : props.value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              if (props.multi) {
                const cur = props.value as string[];
                props.onChange(cur.includes(opt.value) ? cur.filter((v) => v !== opt.value) : [...cur, opt.value]);
              } else {
                props.onChange(opt.value);
              }
            }}
            className={cn('chip', active && 'chip-active')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

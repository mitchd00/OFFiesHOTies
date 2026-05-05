import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onOpenChange, title, children, footer }: Props) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto z-50',
            'bg-white sm:rounded-card shadow-card',
            'sm:max-w-lg sm:max-h-[90vh] overflow-y-auto',
            'p-5',
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <DialogPrimitive.Title className="text-lg font-semibold text-brand-black">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="p-1 -m-1 text-text-light hover:text-brand-black" aria-label="Close">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          <div className="space-y-4">{children}</div>
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

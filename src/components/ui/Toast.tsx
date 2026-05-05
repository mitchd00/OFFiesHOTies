import * as ToastPrimitive from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ToastState {
  message: string;
  open: boolean;
}

interface ToastApi {
  show: (message: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({ message: '', open: false });
  const show = useCallback((message: string) => {
    setState({ message, open: false });
    requestAnimationFrame(() => setState({ message, open: true }));
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      <ToastPrimitive.Provider duration={2000} swipeDirection="down">
        {children}
        <ToastPrimitive.Root
          open={state.open}
          onOpenChange={(o) => setState((s) => ({ ...s, open: o }))}
          className="bg-brand-black text-white px-4 py-2 rounded-card shadow-card text-sm"
        >
          <ToastPrimitive.Title>{state.message}</ToastPrimitive.Title>
        </ToastPrimitive.Root>
        <ToastPrimitive.Viewport className="fixed bottom-4 left-0 right-0 mx-auto max-w-xs flex justify-center z-[60] outline-none" />
      </ToastPrimitive.Provider>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

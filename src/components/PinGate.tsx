import { useState, type FormEvent } from 'react';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { api, ApiError } from '@/lib/api';

interface Props {
  onUnlock: () => void;
}

export function PinGate({ onUnlock }: Props) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.pin.submit(pin);
      onUnlock();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not verify PIN');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-brand-black text-white">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Elite Lifestyle Properties</p>
          <h1 className="text-2xl font-semibold">OFFies and HOTies</h1>
          <p className="text-sm text-white/70">Enter the team PIN to continue.</p>
        </div>
        <div>
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="bg-white/5 text-white border-white/20 focus:border-gold"
          />
        </div>
        {error && <p className="text-sm text-gold">{error}</p>}
        <Button type="submit" disabled={busy || pin.length === 0} fullWidth>
          {busy ? 'Checking' : 'Continue'}
        </Button>
      </form>
    </div>
  );
}

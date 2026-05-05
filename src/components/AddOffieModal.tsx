import { useEffect, useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Input, Label, Textarea } from './ui/Input';
import { Button } from './ui/Button';
import { ChipSelect } from './ChipSelect';
import { AddressAutocomplete, type ParsedAddress } from './AddressAutocomplete';
import { SITUATIONS } from '@/lib/enums';
import { listAgents } from '@/lib/agent';
import type { Agent, Offie } from '@/lib/types';
import { api } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAgent: Agent;
  initial?: Offie | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

export function AddOffieModal({ open, onOpenChange, currentAgent, initial, onSaved, onDeleted }: Props) {
  const [address, setAddress] = useState<ParsedAddress | null>(null);
  const [priceGuide, setPriceGuide] = useState('');
  const [situation, setSituation] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [agentId, setAgentId] = useState<string>(currentAgent.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(initial);
  const canDelete = isEditing && (initial?.agent_id === currentAgent.id || currentAgent.role === 'director');

  useEffect(() => {
    if (open) {
      if (initial) {
        setAddress(initial.property);
        setPriceGuide(initial.price_guide ?? '');
        setSituation(initial.situation);
        setNotes(initial.notes ?? '');
        setAgentId(initial.agent_id);
      } else {
        setAddress(null);
        setPriceGuide('');
        setSituation(null);
        setNotes('');
        setAgentId(currentAgent.id);
      }
      setError(null);
    }
  }, [open, initial, currentAgent.id]);

  async function save() {
    if (!address) { setError('Address is required'); return; }
    if (!situation) { setError('Pick a situation'); return; }
    setBusy(true);
    setError(null);
    try {
      if (initial) {
        await api.offies.update(initial.id, {
          property: address,
          price_guide: priceGuide,
          situation,
          notes,
          agent_id: agentId,
        });
      } else {
        await api.offies.create({
          property: address,
          price_guide: priceGuide,
          situation,
          notes,
          agent_id: agentId,
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!initial) return;
    const ok = window.confirm('Delete this entry. Directors can restore from the recycle bin.');
    if (!ok) return;
    setBusy(true);
    try {
      await api.offies.remove(initial.id);
      onDeleted?.();
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const agents: Agent[] = listAgents();
  const canChooseAgent = currentAgent.role === 'director';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit OFFie' : 'Add OFFie'}
      footer={
        <>
          {canDelete && (
            <Button variant="danger" onClick={remove} disabled={busy} className="mr-auto">
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving' : 'Save'}
          </Button>
        </>
      }
    >
      <AddressAutocomplete value={address} onChange={setAddress} />

      <div>
        <Label htmlFor="price">Price guide</Label>
        <Input
          id="price"
          value={priceGuide}
          onChange={(e) => setPriceGuide(e.target.value)}
          placeholder="e.g. Mid $3Ms"
        />
      </div>

      <div>
        <Label>Situation</Label>
        <ChipSelect options={SITUATIONS} value={situation} onChange={setSituation} />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Background context for the team" />
      </div>

      <div>
        <Label>Agent</Label>
        {canChooseAgent ? (
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full bg-white border border-divider rounded-card px-3 py-2"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-text-dark">{currentAgent.name}</p>
        )}
      </div>

      {error && <p className="text-sm text-gold">{error}</p>}
    </Dialog>
  );
}

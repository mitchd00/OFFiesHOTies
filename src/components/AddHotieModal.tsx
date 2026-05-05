import { useEffect, useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Input, Label, Textarea } from './ui/Input';
import { Button } from './ui/Button';
import { ChipSelect } from './ChipSelect';
import { BUDGET_BANDS } from '@/lib/enums';
import { ALL_SUBURBS } from '@/lib/suburbs';
import { listAgents } from '@/lib/agent';
import type { Agent, Hotie } from '@/lib/types';
import { api } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAgent: Agent;
  initial?: Hotie | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

const SUBURB_OPTIONS = ALL_SUBURBS.map((s) => ({ value: s, label: s }));

export function AddHotieModal({ open, onOpenChange, currentAgent, initial, onSaved, onDeleted }: Props) {
  const [buyerName, setBuyerName] = useState('');
  const [suburbFocus, setSuburbFocus] = useState<string[]>([]);
  const [budgetBand, setBudgetBand] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [agentId, setAgentId] = useState<string>(currentAgent.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(initial);
  const canDelete = isEditing && (initial?.agent_id === currentAgent.id || currentAgent.role === 'director');

  useEffect(() => {
    if (open) {
      if (initial) {
        setBuyerName(initial.buyer_name);
        setSuburbFocus(initial.suburb_focus);
        setBudgetBand(initial.budget_band);
        setBrief(initial.brief ?? '');
        setAgentId(initial.agent_id);
      } else {
        setBuyerName('');
        setSuburbFocus([]);
        setBudgetBand(null);
        setBrief('');
        setAgentId(currentAgent.id);
      }
      setError(null);
    }
  }, [open, initial, currentAgent.id]);

  async function save() {
    if (!buyerName.trim()) { setError('Buyer name is required'); return; }
    if (suburbFocus.length === 0) { setError('Pick at least one suburb'); return; }
    if (!budgetBand) { setError('Pick a budget band'); return; }
    setBusy(true);
    setError(null);
    try {
      if (initial) {
        await api.hoties.update(initial.id, {
          buyer_name: buyerName,
          suburb_focus: suburbFocus,
          budget_band: budgetBand,
          brief,
          agent_id: agentId,
        });
      } else {
        await api.hoties.create({
          buyer_name: buyerName,
          suburb_focus: suburbFocus,
          budget_band: budgetBand,
          brief,
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
      await api.hoties.remove(initial.id);
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
      title={isEditing ? 'Edit HOTie' : 'Add HOTie'}
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
      <div>
        <Label htmlFor="buyer">Buyer name or initials</Label>
        <Input id="buyer" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
      </div>

      <div>
        <Label>Suburb focus</Label>
        <ChipSelect options={SUBURB_OPTIONS} value={suburbFocus} onChange={setSuburbFocus} multi />
      </div>

      <div>
        <Label>Budget band</Label>
        <ChipSelect options={BUDGET_BANDS} value={budgetBand} onChange={setBudgetBand} />
      </div>

      <div>
        <Label htmlFor="brief">Brief</Label>
        <Textarea id="brief" value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What they want" />
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

export const SITUATIONS = [
  { value: 'deceased-estate', label: 'Deceased estate' },
  { value: 'divorce', label: 'Divorce' },
  { value: 'downsizing', label: 'Downsizing' },
  { value: 'upgrading', label: 'Upgrading' },
  { value: 'relocating', label: 'Relocating' },
  { value: 'developer-site', label: 'Developer site' },
  { value: 'financial-pressure', label: 'Financial pressure' },
  { value: 'other', label: 'Other' },
] as const;

export type SituationValue = (typeof SITUATIONS)[number]['value'];

export const SITUATION_VALUES = SITUATIONS.map((s) => s.value) as readonly SituationValue[];

export function situationLabel(value: string): string {
  return SITUATIONS.find((s) => s.value === value)?.label ?? value;
}

export const BUDGET_BANDS = [
  { value: 'sub-800', label: 'Under $800k' },
  { value: '800-1m', label: '$800k – $1m' },
  { value: '1m-1.5m', label: '$1m – $1.5m' },
  { value: '1.5m-2m', label: '$1.5m – $2m' },
  { value: '2m-3m', label: '$2m – $3m' },
  { value: '3m-plus', label: '$3m+' },
] as const;

export type BudgetBandValue = (typeof BUDGET_BANDS)[number]['value'];

export const BUDGET_BAND_VALUES = BUDGET_BANDS.map((b) => b.value) as readonly BudgetBandValue[];

export function budgetBandLabel(value: string): string {
  return BUDGET_BANDS.find((b) => b.value === value)?.label ?? value;
}

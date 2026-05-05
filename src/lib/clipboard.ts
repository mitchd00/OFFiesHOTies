import type { Offie, Hotie } from './types';
import { situationLabel, budgetBandLabel } from './enums';

export function offieBlurb(o: Offie): string {
  const street = o.property.street.trim();
  const suburb = o.property.suburb.trim();
  const priceGuide = (o.price_guide ?? '').trim();
  const sit = situationLabel(o.situation);
  const pricePart = priceGuide ? `, ${priceGuide}` : '';
  return `Off-market opportunity, ${street} ${suburb}${pricePart}. ${sit}. ELITE introduction only.`;
}

export function hotieBlurb(h: Hotie): string {
  const focus = h.suburb_focus.join(', ');
  const band = budgetBandLabel(h.budget_band);
  const brief = (h.brief ?? '').trim();
  const briefPart = brief ? ` ${brief.endsWith('.') ? brief : brief + '.'}` : '';
  return `Active buyer registered with ELITE. ${focus}, ${band}.${briefPart}`;
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

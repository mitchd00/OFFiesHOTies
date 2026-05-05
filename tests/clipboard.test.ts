import { describe, expect, test } from 'vitest';
import { offieBlurb, hotieBlurb } from '../src/lib/clipboard';
import type { Offie, Hotie } from '../src/lib/types';

const baseOffie: Offie = {
  id: '1',
  property: { street: '12 Foreshore Pde', suburb: 'Pelican Waters', postcode: '4551', lat: null, lng: null },
  price_guide: 'Mid $3Ms',
  situation: 'deceased-estate',
  notes: null,
  agent_id: 'mitch-lund',
  agent_name: 'Mitch Lund',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

const baseHotie: Hotie = {
  id: '1',
  buyer_name: 'JS family',
  suburb_focus: ['Pelican Waters', 'Buddina'],
  budget_band: '2m-3m',
  brief: 'Wants modern home, walkable to school',
  agent_id: 'mitch-lund',
  agent_name: 'Mitch Lund',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

describe('offieBlurb', () => {
  test('matches the spec format', () => {
    expect(offieBlurb(baseOffie)).toBe(
      'Off-market opportunity, 12 Foreshore Pde Pelican Waters, Mid $3Ms. Deceased estate. ELITE introduction only.',
    );
  });
  test('omits price guide when blank', () => {
    expect(offieBlurb({ ...baseOffie, price_guide: '' })).toBe(
      'Off-market opportunity, 12 Foreshore Pde Pelican Waters. Deceased estate. ELITE introduction only.',
    );
  });
});

describe('hotieBlurb', () => {
  test('matches the spec format', () => {
    expect(hotieBlurb(baseHotie)).toBe(
      'Active buyer registered with ELITE. Pelican Waters, Buddina, $2m – $3m. Wants modern home, walkable to school.',
    );
  });
});

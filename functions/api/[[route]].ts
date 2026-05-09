/// <reference types="@cloudflare/workers-types" />

import { suburbsForCluster } from '../../src/lib/suburbs';

interface Env {
  DB: D1Database;
  APP_PIN_HASH: string;
  SESSION_SECRET: string;
  SESSION_TTL_HOURS?: string;
}

const SESSION_COOKIE = 'oh_session';
const SITUATION_VALUES = [
  'deceased-estate', 'divorce', 'downsizing', 'upgrading',
  'relocating', 'developer-site', 'financial-pressure', 'other',
];
const BUDGET_BAND_VALUES = ['sub-800', '800-1m', '1m-1.5m', '1.5m-2m', '2m-3m', '3m-plus'];

// ---------- helpers ----------

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
}

function err(status: number, message: string): Response {
  return json({ error: message }, { status });
}

function uuid(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get('Cookie') ?? '';
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('='));
  }
  return out;
}

async function makeSessionCookie(secret: string, ttlHours: number): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacHex(secret, ts);
  const value = `${ts}.${sig}`;
  const maxAge = ttlHours * 60 * 60;
  return `${SESSION_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

async function checkSession(request: Request, env: Env): Promise<boolean> {
  const cookies = parseCookies(request);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return false;
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return false;
  const ts = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = await hmacHex(env.SESSION_SECRET, ts);
  if (!timingSafeEqual(sig, expected)) return false;
  const ttlHours = Number(env.SESSION_TTL_HOURS ?? '8');
  const ageMs = Date.now() - Number(ts);
  if (!Number.isFinite(ageMs) || ageMs < 0) return false;
  if (ageMs > ttlHours * 60 * 60 * 1000) return false;
  return true;
}

interface CallerAgent {
  id: string;
  name: string;
  role: 'agent' | 'director';
}

async function loadAgent(env: Env, request: Request): Promise<CallerAgent | null> {
  const id = request.headers.get('X-Agent-Id');
  if (!id) return null;
  const row = await env.DB
    .prepare('SELECT id, name, role FROM agents WHERE id = ? AND active = 1')
    .bind(id)
    .first<CallerAgent>();
  return row ?? null;
}

async function authOrError(request: Request, env: Env): Promise<{ agent: CallerAgent } | Response> {
  if (!(await checkSession(request, env))) return err(401, 'Session expired');
  const agent = await loadAgent(env, request);
  if (!agent) return err(401, 'Unknown agent');
  return { agent };
}

// ---------- shape helpers ----------

interface OffieRow {
  id: string;
  property_id: string;
  price_guide: string | null;
  situation: string;
  notes: string | null;
  agent_id: string;
  agent_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  street: string;
  suburb: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

function shapeOffie(r: OffieRow) {
  return {
    id: r.id,
    property: {
      street: r.street,
      suburb: r.suburb,
      postcode: r.postcode,
      lat: r.lat,
      lng: r.lng,
    },
    price_guide: r.price_guide,
    situation: r.situation,
    notes: r.notes,
    agent_id: r.agent_id,
    agent_name: r.agent_name,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

interface HotieRow {
  id: string;
  buyer_name: string;
  suburb_focus: string;
  budget_band: string;
  brief: string | null;
  agent_id: string;
  agent_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

function shapeHotie(r: HotieRow) {
  let focus: string[] = [];
  try {
    const parsed = JSON.parse(r.suburb_focus);
    if (Array.isArray(parsed)) focus = parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    focus = [];
  }
  return {
    id: r.id,
    buyer_name: r.buyer_name,
    suburb_focus: focus,
    budget_band: r.budget_band,
    brief: r.brief,
    agent_id: r.agent_id,
    agent_name: r.agent_name,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// ---------- validation ----------

function asString(v: unknown, max = 1000): string {
  if (typeof v !== 'string') throw new Error('expected string');
  const t = v.trim();
  if (t.length > max) throw new Error('value too long');
  return t;
}

function asOptionalString(v: unknown, max = 4000): string | null {
  if (v == null || v === '') return null;
  return asString(v, max);
}

function validateProperty(p: unknown): { street: string; suburb: string; postcode: string; lat: number | null; lng: number | null } {
  if (!p || typeof p !== 'object') throw new Error('property required');
  const o = p as Record<string, unknown>;
  return {
    street: asString(o.street, 200),
    suburb: asString(o.suburb, 100),
    postcode: asString(o.postcode, 10),
    lat: typeof o.lat === 'number' ? o.lat : null,
    lng: typeof o.lng === 'number' ? o.lng : null,
  };
}

// ---------- routes ----------

async function handlePin(request: Request, env: Env, sub: string[]): Promise<Response> {
  if (sub[0] === 'check' && request.method === 'GET') {
    return json({ ok: await checkSession(request, env) });
  }
  if (request.method !== 'POST') return err(405, 'Method not allowed');
  const body = await request.json().catch(() => null);
  const pin = body && typeof body === 'object' ? (body as Record<string, unknown>).pin : null;
  if (typeof pin !== 'string' || pin.length === 0) return err(400, 'PIN required');
  const incomingHash = await sha256Hex(pin);
  if (!timingSafeEqual(incomingHash, env.APP_PIN_HASH.toLowerCase())) {
    return err(401, 'Incorrect PIN');
  }
  const ttlHours = Number(env.SESSION_TTL_HOURS ?? '8');
  const cookie = await makeSessionCookie(env.SESSION_SECRET, ttlHours);
  return json({ ok: true }, { headers: { 'Set-Cookie': cookie } });
}

async function listOffies(env: Env, cluster: string): Promise<Response> {
  const sql = `
    SELECT o.*, p.street, p.suburb, p.postcode, p.lat, p.lng, a.name AS agent_name
    FROM offies o
    JOIN properties p ON p.id = o.property_id
    JOIN agents a ON a.id = o.agent_id
    WHERE o.deleted_at IS NULL
    ${cluster === 'all' ? '' : 'AND p.suburb IN (' + suburbPlaceholders(cluster) + ')'}
    ORDER BY o.updated_at DESC
  `;
  const stmt = cluster === 'all'
    ? env.DB.prepare(sql)
    : env.DB.prepare(sql).bind(...suburbsForCluster(cluster as 'caloundra' | 'kawana'));
  const { results } = await stmt.all<OffieRow>();
  return json(results.map(shapeOffie));
}

function suburbPlaceholders(cluster: string): string {
  return suburbsForCluster(cluster as 'caloundra' | 'kawana').map(() => '?').join(', ');
}

async function createOffie(request: Request, env: Env, agent: CallerAgent): Promise<Response> {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return err(400, 'Invalid JSON'); }
  let prop, situation: string, priceGuide: string | null, notes: string | null, ownerId: string;
  try {
    prop = validateProperty(body.property);
    situation = asString(body.situation, 50);
    if (!SITUATION_VALUES.includes(situation)) return err(400, 'Invalid situation');
    priceGuide = asOptionalString(body.price_guide, 100);
    notes = asOptionalString(body.notes, 4000);
    ownerId = asString(body.agent_id, 100);
  } catch (e) {
    return err(400, (e as Error).message);
  }
  const ownerCheck = await env.DB.prepare('SELECT id FROM agents WHERE id = ? AND active = 1').bind(ownerId).first();
  if (!ownerCheck) return err(400, 'Invalid agent_id');

  const propId = uuid();
  const offId = uuid();
  const ts = nowIso();
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO properties (id, street, suburb, postcode, lat, lng, created_at, created_by) VALUES (?,?,?,?,?,?,?,?)',
    ).bind(propId, prop.street, prop.suburb, prop.postcode, prop.lat, prop.lng, ts, agent.id),
    env.DB.prepare(
      'INSERT INTO offies (id, property_id, price_guide, situation, notes, agent_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
    ).bind(offId, propId, priceGuide, situation, notes, ownerId, ts, ts),
  ]);
  return loadOffieById(env, offId);
}

async function loadOffieById(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare(`
    SELECT o.*, p.street, p.suburb, p.postcode, p.lat, p.lng, a.name AS agent_name
    FROM offies o JOIN properties p ON p.id = o.property_id JOIN agents a ON a.id = o.agent_id
    WHERE o.id = ?`).bind(id).first<OffieRow>();
  if (!row) return err(404, 'Not found');
  return json(shapeOffie(row));
}

async function updateOffie(request: Request, env: Env, agent: CallerAgent, id: string): Promise<Response> {
  const existing = await env.DB.prepare('SELECT * FROM offies WHERE id = ? AND deleted_at IS NULL').bind(id).first<OffieRow>();
  if (!existing) return err(404, 'Not found');
  if (existing.agent_id !== agent.id && agent.role !== 'director') return err(403, 'Not yours to edit');

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return err(400, 'Invalid JSON'); }
  const ts = nowIso();

  if (body.refresh === true && Object.keys(body).length === 1) {
    await env.DB.prepare('UPDATE offies SET updated_at = ? WHERE id = ?').bind(ts, id).run();
    return loadOffieById(env, id);
  }

  const updates: string[] = ['updated_at = ?'];
  const values: unknown[] = [ts];

  if (body.price_guide !== undefined) { updates.push('price_guide = ?'); values.push(asOptionalString(body.price_guide, 100)); }
  if (body.situation !== undefined) {
    const s = asString(body.situation, 50);
    if (!SITUATION_VALUES.includes(s)) return err(400, 'Invalid situation');
    updates.push('situation = ?'); values.push(s);
  }
  if (body.notes !== undefined) { updates.push('notes = ?'); values.push(asOptionalString(body.notes, 4000)); }
  if (body.agent_id !== undefined) {
    const newOwner = asString(body.agent_id, 100);
    const check = await env.DB.prepare('SELECT id FROM agents WHERE id = ? AND active = 1').bind(newOwner).first();
    if (!check) return err(400, 'Invalid agent_id');
    updates.push('agent_id = ?'); values.push(newOwner);
  }

  values.push(id);
  await env.DB.prepare(`UPDATE offies SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  if (body.property && typeof body.property === 'object') {
    const prop = validateProperty(body.property);
    await env.DB.prepare(
      'UPDATE properties SET street = ?, suburb = ?, postcode = ?, lat = ?, lng = ? WHERE id = ?',
    ).bind(prop.street, prop.suburb, prop.postcode, prop.lat, prop.lng, existing.property_id).run();
  }
  return loadOffieById(env, id);
}

async function deleteOffie(env: Env, agent: CallerAgent, id: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT agent_id FROM offies WHERE id = ? AND deleted_at IS NULL').bind(id).first<{ agent_id: string }>();
  if (!row) return err(404, 'Not found');
  if (row.agent_id !== agent.id && agent.role !== 'director') return err(403, 'Not yours to delete');
  await env.DB.prepare('UPDATE offies SET deleted_at = ?, deleted_by = ? WHERE id = ?')
    .bind(nowIso(), agent.id, id).run();
  return new Response(null, { status: 204 });
}

async function listHoties(env: Env, cluster: string): Promise<Response> {
  if (cluster === 'all') {
    const { results } = await env.DB.prepare(`
      SELECT h.*, a.name AS agent_name FROM hoties h JOIN agents a ON a.id = h.agent_id
      WHERE h.deleted_at IS NULL ORDER BY h.updated_at DESC`).all<HotieRow>();
    return json(results.map(shapeHotie));
  }
  const subs = suburbsForCluster(cluster as 'caloundra' | 'kawana');
  const placeholders = subs.map(() => '?').join(', ');
  const sql = `
    SELECT h.*, a.name AS agent_name FROM hoties h JOIN agents a ON a.id = h.agent_id
    WHERE h.deleted_at IS NULL
      AND EXISTS (
        SELECT 1 FROM json_each(h.suburb_focus) je WHERE je.value IN (${placeholders})
      )
    ORDER BY h.updated_at DESC`;
  const { results } = await env.DB.prepare(sql).bind(...subs).all<HotieRow>();
  return json(results.map(shapeHotie));
}

async function createHotie(request: Request, env: Env, _agent: CallerAgent): Promise<Response> {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return err(400, 'Invalid JSON'); }
  let buyer: string, focus: string[], band: string, brief: string | null, ownerId: string;
  try {
    buyer = asString(body.buyer_name, 200);
    if (!Array.isArray(body.suburb_focus) || body.suburb_focus.length === 0) throw new Error('suburb_focus required');
    focus = (body.suburb_focus as unknown[]).map((s) => asString(s, 100));
    band = asString(body.budget_band, 50);
    if (!BUDGET_BAND_VALUES.includes(band)) return err(400, 'Invalid budget_band');
    brief = asOptionalString(body.brief, 4000);
    ownerId = asString(body.agent_id, 100);
  } catch (e) {
    return err(400, (e as Error).message);
  }
  const ownerCheck = await env.DB.prepare('SELECT id FROM agents WHERE id = ? AND active = 1').bind(ownerId).first();
  if (!ownerCheck) return err(400, 'Invalid agent_id');

  const id = uuid();
  const ts = nowIso();
  await env.DB.prepare(
    'INSERT INTO hoties (id, buyer_name, suburb_focus, budget_band, brief, agent_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
  ).bind(id, buyer, JSON.stringify(focus), band, brief, ownerId, ts, ts).run();
  return loadHotieById(env, id);
}

async function loadHotieById(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare(
    'SELECT h.*, a.name AS agent_name FROM hoties h JOIN agents a ON a.id = h.agent_id WHERE h.id = ?',
  ).bind(id).first<HotieRow>();
  if (!row) return err(404, 'Not found');
  return json(shapeHotie(row));
}

async function updateHotie(request: Request, env: Env, agent: CallerAgent, id: string): Promise<Response> {
  const existing = await env.DB.prepare('SELECT * FROM hoties WHERE id = ? AND deleted_at IS NULL').bind(id).first<HotieRow>();
  if (!existing) return err(404, 'Not found');
  if (existing.agent_id !== agent.id && agent.role !== 'director') return err(403, 'Not yours to edit');

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return err(400, 'Invalid JSON'); }
  const ts = nowIso();

  if (body.refresh === true && Object.keys(body).length === 1) {
    await env.DB.prepare('UPDATE hoties SET updated_at = ? WHERE id = ?').bind(ts, id).run();
    return loadHotieById(env, id);
  }

  const updates: string[] = ['updated_at = ?'];
  const values: unknown[] = [ts];

  if (body.buyer_name !== undefined) { updates.push('buyer_name = ?'); values.push(asString(body.buyer_name, 200)); }
  if (body.suburb_focus !== undefined) {
    if (!Array.isArray(body.suburb_focus) || body.suburb_focus.length === 0) return err(400, 'suburb_focus required');
    const focus = (body.suburb_focus as unknown[]).map((s) => asString(s, 100));
    updates.push('suburb_focus = ?'); values.push(JSON.stringify(focus));
  }
  if (body.budget_band !== undefined) {
    const b = asString(body.budget_band, 50);
    if (!BUDGET_BAND_VALUES.includes(b)) return err(400, 'Invalid budget_band');
    updates.push('budget_band = ?'); values.push(b);
  }
  if (body.brief !== undefined) { updates.push('brief = ?'); values.push(asOptionalString(body.brief, 4000)); }
  if (body.agent_id !== undefined) {
    const newOwner = asString(body.agent_id, 100);
    const check = await env.DB.prepare('SELECT id FROM agents WHERE id = ? AND active = 1').bind(newOwner).first();
    if (!check) return err(400, 'Invalid agent_id');
    updates.push('agent_id = ?'); values.push(newOwner);
  }

  values.push(id);
  await env.DB.prepare(`UPDATE hoties SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  return loadHotieById(env, id);
}

async function deleteHotie(env: Env, agent: CallerAgent, id: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT agent_id FROM hoties WHERE id = ? AND deleted_at IS NULL').bind(id).first<{ agent_id: string }>();
  if (!row) return err(404, 'Not found');
  if (row.agent_id !== agent.id && agent.role !== 'director') return err(403, 'Not yours to delete');
  await env.DB.prepare('UPDATE hoties SET deleted_at = ?, deleted_by = ? WHERE id = ?')
    .bind(nowIso(), agent.id, id).run();
  return new Response(null, { status: 204 });
}

async function listRecycleBin(env: Env): Promise<Response> {
  const offies = await env.DB.prepare(`
    SELECT 'offie' AS type, o.id, p.street || ' ' || p.suburb AS preview,
           o.deleted_at, o.deleted_by, a.name AS deleted_by_name
    FROM offies o
    JOIN properties p ON p.id = o.property_id
    LEFT JOIN agents a ON a.id = o.deleted_by
    WHERE o.deleted_at IS NOT NULL`).all<{
      type: string; id: string; preview: string; deleted_at: string; deleted_by: string; deleted_by_name: string;
    }>();
  const hoties = await env.DB.prepare(`
    SELECT 'hotie' AS type, h.id, h.buyer_name AS preview,
           h.deleted_at, h.deleted_by, a.name AS deleted_by_name
    FROM hoties h
    LEFT JOIN agents a ON a.id = h.deleted_by
    WHERE h.deleted_at IS NOT NULL`).all<{
      type: string; id: string; preview: string; deleted_at: string; deleted_by: string; deleted_by_name: string;
    }>();
  const all = [...offies.results, ...hoties.results].sort(
    (a, b) => b.deleted_at.localeCompare(a.deleted_at),
  );
  return json(all);
}

async function restoreFromBin(env: Env, type: string, id: string): Promise<Response> {
  const table = type === 'offie' ? 'offies' : type === 'hotie' ? 'hoties' : null;
  if (!table) return err(400, 'Invalid type');
  await env.DB.prepare(`UPDATE ${table} SET deleted_at = NULL, deleted_by = NULL WHERE id = ?`).bind(id).run();
  return new Response(null, { status: 204 });
}

async function purgeFromBin(env: Env, type: string, id: string): Promise<Response> {
  if (type === 'offie') {
    const row = await env.DB.prepare('SELECT property_id FROM offies WHERE id = ?').bind(id).first<{ property_id: string }>();
    if (row) {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM offies WHERE id = ?').bind(id),
        env.DB.prepare('DELETE FROM properties WHERE id = ?').bind(row.property_id),
      ]);
    }
    return new Response(null, { status: 204 });
  }
  if (type === 'hotie') {
    await env.DB.prepare('DELETE FROM hoties WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204 });
  }
  return err(400, 'Invalid type');
}

// ---------- entry ----------

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (segments[0] !== 'api') return err(404, 'Not found');
  const path = segments.slice(1);

  if (path[0] === 'pin') {
    return handlePin(request, env, path.slice(1));
  }

  const auth = await authOrError(request, env);
  if (auth instanceof Response) return auth;
  const { agent } = auth;

  if (path[0] === 'offies') {
    if (!path[1]) {
      if (request.method === 'GET') {
        const cluster = url.searchParams.get('cluster') ?? 'all';
        if (!['all', 'caloundra', 'kawana'].includes(cluster)) return err(400, 'Invalid cluster');
        return listOffies(env, cluster);
      }
      if (request.method === 'POST') return createOffie(request, env, agent);
      return err(405, 'Method not allowed');
    }
    const id = path[1];
    if (request.method === 'PATCH') return updateOffie(request, env, agent, id);
    if (request.method === 'DELETE') return deleteOffie(env, agent, id);
    return err(405, 'Method not allowed');
  }

  if (path[0] === 'hoties') {
    if (!path[1]) {
      if (request.method === 'GET') {
        const cluster = url.searchParams.get('cluster') ?? 'all';
        if (!['all', 'caloundra', 'kawana'].includes(cluster)) return err(400, 'Invalid cluster');
        return listHoties(env, cluster);
      }
      if (request.method === 'POST') return createHotie(request, env, agent);
      return err(405, 'Method not allowed');
    }
    const id = path[1];
    if (request.method === 'PATCH') return updateHotie(request, env, agent, id);
    if (request.method === 'DELETE') return deleteHotie(env, agent, id);
    return err(405, 'Method not allowed');
  }

  if (path[0] === 'recycle-bin') {
    if (agent.role !== 'director') return err(403, 'Director only');
    if (!path[1]) {
      if (request.method === 'GET') return listRecycleBin(env);
      return err(405, 'Method not allowed');
    }
    const type = path[1];
    const id = path[2];
    if (path[3] === 'restore' && request.method === 'POST') return restoreFromBin(env, type, id);
    if (request.method === 'DELETE') return purgeFromBin(env, type, id);
    return err(405, 'Method not allowed');
  }

  return err(404, 'Not found');
};

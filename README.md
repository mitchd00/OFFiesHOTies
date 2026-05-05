# OFFies and HOTies

Internal mobile-first web app for Elite Lifestyle Properties (ELP). Two-sided
board: off-market opportunities (OFFies) and ELITE-qualified direct buyers
(HOTies).

## Stack

- Vite + React 18 + TypeScript
- Tailwind + shadcn-style primitives
- Cloudflare Pages + D1 (Pages Function at `functions/api/[[route]].ts`)
- Google Maps JS API + Places Autocomplete

## Local development

```bash
npm install

# Apply schema to a local D1 instance
npx wrangler d1 execute offies-hoties-db --local --file schema/0001_init.sql

# Run Vite dev server alongside Pages Functions
npx wrangler pages dev --d1 DB=offies-hoties-db --compatibility-date=2025-05-01 -- npm run dev
```

Set the following env vars (locally via `.dev.vars`, in production via
Cloudflare Pages secrets):

| Var | Description |
| --- | --- |
| `APP_PIN_HASH` | SHA-256 hex digest of the team PIN |
| `SESSION_SECRET` | 32-byte random hex string for HMAC session signing |
| `SESSION_TTL_HOURS` | Optional, defaults to 8 |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS + Places key (build-time, public) |

Generate the PIN hash:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PIN').digest('hex'))"
```

Generate the session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Tests

```bash
npm test            # runs vitest including the behavioural lint
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

## Roadmap

| Ver | Name | Status |
| --- | --- | --- |
| v1  | OFFies + HOTies | this repo |
| v2  | BA Buyers | planned |
| v3  | Reserved | planned |
| v4  | ELITE Listings | planned |
| v5  | Matching | planned |
| v6  | Rent Roll (director only) | planned |
| v7  | Rent Roll Map | planned |
| v8  | Listings + OFFies Map | planned |

The v1 schema is shaped so v2 to v8 are additive — see
`schema/0001_init.sql` for the future-table stubs.

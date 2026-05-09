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

## Deploy (Cloudflare Pages)

The D1 database `offies-hoties-db` is already provisioned and seeded
with the seven agents. The `database_id` in `wrangler.toml` points to
it. Remaining steps to ship:

1. **Create a Pages project** connected to this repo's GitHub:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
2. **Bind D1 to the Pages project**: in Pages → Settings → Functions →
   D1 database bindings, add `DB` → `offies-hoties-db`.
3. **Set production secrets**:

   ```bash
   npx wrangler pages secret put APP_PIN_HASH
   npx wrangler pages secret put SESSION_SECRET
   # optional:
   npx wrangler pages secret put SESSION_TTL_HOURS
   ```

4. **Set the Google Maps key as a build-time env var** (Pages →
   Settings → Environment variables → Production):
   `VITE_GOOGLE_MAPS_API_KEY` = your key. Restrict the key in Google
   Cloud Console to the Pages domain (e.g.
   `https://offies-hoties.pages.dev/*`).
5. **Deploy**: merge the PR. Pages will build and deploy automatically.

If you ever need to re-apply the schema after a wipe:

```bash
npx wrangler d1 execute offies-hoties-db --remote --file schema/0001_init.sql
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

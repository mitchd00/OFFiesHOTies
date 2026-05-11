# OFFies & HOTies — v1 deploy handover

Everything in code is done and CI is green on PR #1. This document
covers the remaining manual setup on Cloudflare and Google Cloud.
Estimated time: 20–30 minutes.

---

## 1. Pre-reqs

- Access to the Cloudflare account `Mitchd00@gmail.com's Account`
  (account ID `ff3c65b28883cf2f0b5ec97dbf886205`).
- Access to a Google Cloud project that can issue a Maps JavaScript
  API + Places API key.
- Node 20 + npm installed locally.
- The repo cloned and `npm install` run once.

The D1 database `offies-hoties-db`
(`831b73f5-c580-4f62-9cfa-932bdf956f96`) already exists, has the
schema applied, and is seeded with all seven agents — no action
needed there.

---

## 2. Decide the team PIN

Pick a PIN (4–8 digits is typical). Generate its SHA-256 hash:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PIN_HERE').digest('hex'))"
```

Save the hex output — that's `APP_PIN_HASH`. Save the PIN itself
somewhere only the team can see (1Password etc).

---

## 3. Generate the session secret

Once, never share, never rotate without redeploying:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

That 64-character hex string is `SESSION_SECRET`.

---

## 4. Get a Google Maps API key

1. Google Cloud Console → APIs & Services → Library:
   - Enable **Maps JavaScript API**
   - Enable **Places API**
2. Credentials → Create credentials → API key. Copy the key.
3. Click the key to edit it. Under **Application restrictions**:
   - Pick **HTTP referrers (web sites)**
   - Add the eventual Pages domain (e.g. `https://offies-hoties.pages.dev/*`)
   - Optionally add the custom domain too (e.g. `https://offies.eliteproperties.com.au/*`)
4. Under **API restrictions** select **Restrict key** and tick only
   Maps JavaScript API + Places API.

That key is `VITE_GOOGLE_MAPS_API_KEY`. It's a public, build-time
value — the referrer restriction is what keeps it safe.

---

## 5. Create the Pages project

In the Cloudflare dashboard → Workers & Pages → **Create application**
→ **Pages** → **Connect to Git**:

- **Repository**: `mitchd00/OFFiesHOTies`
- **Production branch**: `Mitchd00/OffiesandHoties` (the default
  branch in this repo)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: leave blank (or `/`)
- **Environment variables (build-time, Production)**:
  - `VITE_GOOGLE_MAPS_API_KEY` = the key from step 4
  - `NODE_VERSION` = `20`

Save and let the first build run — it will fail with "binding DB not
found" or 500s on `/api/*` until you finish steps 6 and 7. That's
expected.

---

## 6. Verify the D1 binding

The binding is declared in `wrangler.toml` (`DB` →
`offies-hoties-db`, id `831b73f5-c580-4f62-9cfa-932bdf956f96`), so a
Pages project connected to this repo picks it up automatically on
build.

Open Pages project → **Settings** → **Functions** → **D1 database
bindings** and confirm `DB` is listed for Production (and Preview if
you plan to use preview deploys). If it's missing, add it manually:

- **Variable name**: `DB` (must match exactly — the code reads
  `env.DB`)
- **D1 database**: `offies-hoties-db`

---

## 7. Set the runtime secrets

From the project root locally, with `wrangler` already installed via
`npm install`:

```bash
npx wrangler login

# These will prompt you for the value, then store it as a secret:
npx wrangler pages secret put APP_PIN_HASH --project-name offies-hoties
npx wrangler pages secret put SESSION_SECRET --project-name offies-hoties

# Optional, default is 8 hours if you skip this:
npx wrangler pages secret put SESSION_TTL_HOURS --project-name offies-hoties
```

Alternative: do it through the Pages dashboard → Settings →
Environment variables → Production → **Encrypt** each one.

---

## 8. Trigger a build

The v1 code is already merged to `Mitchd00/OffiesandHoties` (PR #1),
so connecting the Pages project in step 5 should kick off the first
build automatically. If it didn't, push any commit to the production
branch — or hit **Retry deployment** in the Pages dashboard once
steps 6 and 7 are done.

Secrets are read at request time, so rotating a secret usually does
not require a redeploy.

---

## 9. Smoke test the live deploy

Visit the Pages URL on a phone and an iOS Safari + Android Chrome
device. Verify:

- [ ] PIN gate appears, wrong PIN rejected, correct PIN unlocks
- [ ] Agent picker shows all seven names; pick one and continue
- [ ] OFFies and HOTies boards both render with `(0)` counts
- [ ] Floating + button → Add OFFie:
  - Address autocomplete suggests Sunshine Coast addresses
  - Save without picking a situation → blocked
  - Pick a Caloundra-side situation, save → card appears in board
- [ ] Add HOTie with Pelican Waters + Buddina + $2m–$3m → card appears
- [ ] Tap OFFie copy icon → toast says `Copied`, paste somewhere and
  verify exact format: `Off-market opportunity, …, …. {Situation}.
  ELITE introduction only.`
- [ ] Tap HOTie copy icon → exact format: `Active buyer registered
  with ELITE. {suburbs}, {band}. {brief}.`
- [ ] Suburb pills filter correctly (All / Caloundra side / Kawana
  side)
- [ ] Log in as Mitch (director) → Recycle bin icon visible in header
- [ ] Log in as a non-director → no Recycle bin icon
- [ ] Delete an OFFie as its owner → disappears from board
- [ ] As Mitch, open Recycle bin → deleted OFFie listed → Restore →
  reappears on board
- [ ] Try a Brisbane address (postcode 4000) → warning shown but save
  works

---

## 10. Switch agents on a shared device

Any agent can switch to another agent: header → top-right exit icon.
That clears the local agent selection and re-shows the picker. The
PIN session is independent — agents share the same device session.

---

## 11. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `/api/pin` always 401, even with correct PIN | `APP_PIN_HASH` not set, or set with wrong casing — must be lowercase hex |
| `/api/*` returns 500 | `DB` binding missing in Pages settings, or schema not applied |
| Address field shows "autocomplete unavailable" | `VITE_GOOGLE_MAPS_API_KEY` not set at build time, or referrer restriction is blocking the live domain |
| Session immediately re-prompts for PIN | `SESSION_SECRET` rotated since last sign-in (every secret rotation invalidates all sessions — by design) |
| Recycle bin returns 403 | Not logged in as a director; only `mitch-lund` and `jordan-lund` have `role: 'director'` |

---

## 12. After v1 is live

Roadmap is in the README. v2 (BA Buyers) is the natural next step
and reuses the existing card pattern, modal pattern, and soft-delete
flow — should be a small follow-up PR.

The v1 schema already includes stub tables for `ba_buyers` (v2),
`listings` (v4), and `rent_roll` (v6) so future versions only need
`ALTER TABLE`, never `CREATE TABLE`.

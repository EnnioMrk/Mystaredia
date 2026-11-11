# Mystaredia — Cloudflare build

The 2022 PHP site, rebuilt as one Cloudflare Worker with static assets and one D1 database.
No PHP, no container, no always-on process.

Branch `recreate`. The `main` branch keeps the original PHP tree.

## Architecture

| Path | Handled by | Cost |
| --- | --- | --- |
| `/`, `/sites/**`, `/assets/**`, `/error/**` | Static assets on the edge cache | 0 Worker requests |
| `/api/pages` | Worker: returns `data/sites.json` | 1 request, 1 ms CPU |
| `GET /api/chat` | Worker: last 10 rows from D1 | 1 request, 1 D1 read |
| `POST /api/chat` | Worker: insert + trim to 10 rows | 1 request, 1 D1 batch |
| `/api/mai` | Worker: proxy to the chatbot | 1 request, 1 subrequest |

`assets.run_worker_first` is set to `/api/*` only. A request for a static file never starts the Worker.

## Live

https://mystaredia.ennio-marke.workers.dev

## Cost: zero

Every product in this build has a free tier. No paid feature is used.

| Product | Free allowance | What this site uses |
| --- | --- | --- |
| Workers Free | 100,000 requests/day, 10 ms CPU per request | static files use 0 requests; only `/api/*` counts |
| D1 Free | 5 million rows read/day, 100,000 rows written/day, 5 GB | 10 rows per poll, 3 rows per message |
| Static assets | 20,000 files, 25 MiB each | 35 files |
| workers.dev | free subdomain | `mystaredia.ennio-marke.workers.dev` |

Over a limit the request fails; Cloudflare does not bill the free plan. The tightest cap is the 100,000 requests/day: one chat tab polls every 3 s, which is about 28,800 requests/day. Raise `3000` in `public/sites/chat/index.html` if you run many tabs all day.

- Worker bundle: 4.20 KiB, 1.63 KiB gzip.
- Bindings: one D1 database. No KV, R2, Queues or Durable Objects.
- The chat polls every 3 s and stops while the tab is hidden. The old code polled every 500 ms without pause.

## Layout

```
worker/index.js     the whole backend
data/sites.json     password gate list (was na_Files/sites.json)
public/             static assets (was public_html/, all .php removed)
migrations/         D1 schema + seed of the old 10 messages
legacy/htaccess.conf  the old Apache config, for reference only
wrangler.jsonc      Worker, assets and D1 bindings
```

## Local development

```bash
npm install          # wrangler 4.30.0; use Node 20+
npm run db:local     # create the local D1 tables and seed
npm run dev          # http://127.0.0.1:8787
```

Node 22.12 or newer lets you use a newer wrangler. Remove the exact pin in `package.json` and raise `compatibility_date` in `wrangler.jsonc` when you do.

## Deploy

The Worker and the D1 database are live already. To ship a change:

```bash
npm run deploy
```

To rebuild from scratch:

```bash
npx wrangler login
npx wrangler d1 create mystaredia          # copy database_id into wrangler.jsonc
npm run db:remote
npm run deploy
```

D1 database `mystaredia`: `478996b4-824f-49cd-a588-473f674d9302` (region WEUR).

Custom domain: `mystaredia.de` is **not** in this Cloudflare account, so the site runs on the workers.dev URL. Add the zone, then dashboard → Workers & Pages → `mystaredia` → Settings → Domains & Routes → Add custom domain. A subdomain of `ennio.vip` works today with no new zone.

The old `.htaccess` sent `mystaredia.de` to `www.mystaredia.de`. Workers cannot see the host redirect rule. Use a Cloudflare Redirect Rule (Rules → Redirect Rules) for that, or drop it.

## What replaced what

| Old | New |
| --- | --- |
| `index.php` + `file_get_contents('../na_Files/sites.json')` | `public/index.html` + `GET /api/pages` |
| `sites/chat/index.php` (flock on `messages.json`) | `GET`/`POST /api/chat` + D1 |
| `sites/chat/mai/index.php` + Glitch proxy | `public/sites/chat/mai/` + `GET /api/mai` |
| `jquery/index.php` | `public/jquery/index.html` |
| `.htaccess` error documents | `public/404.html` + `not_found_handling` |
| `.htaccess` rewrites | `public/_redirects` (old `.php` URLs, 301) |
| — | `public/_headers` (nosniff, frame options, cache policy) |

## Known gaps

- **The password gate is cosmetic.** The browser gets every password and URL in `/api/pages`, exactly as before. A real gate needs one Worker check per login and a signed cookie.
- **The chat is public and unauthenticated.** Same as before. Add a Cloudflare WAF rate limit on `/api/chat` if it gets abused.
- **`api.brainshop.ai` no longer resolves**, so the `mai` chatbot cannot answer. The proxy returns a fixed message. Set `BRAINSHOP_BID` and `BRAINSHOP_KEY` in `wrangler.jsonc` to a working service, or delete the two `mai` pages.
- **The chat keeps 10 messages.** Same limit as the PHP version. Change `MAX_MESSAGES` in `worker/index.js` to keep more.

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

## Resource use

- Worker bundle: 4.20 KiB, 1.63 KiB gzip.
- Bindings: one D1 database. No KV, R2, Queues or Durable Objects.
- Free plan headroom: 100,000 requests/day, D1 5 million row reads/day and 100,000 writes/day, 500 MB storage.
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

```bash
npx wrangler login
npx wrangler d1 create mystaredia          # copy database_id into wrangler.jsonc
npm run db:remote
npm run deploy
```

Then add the domain: dashboard → Workers & Pages → `mystaredia` → Settings → Domains & Routes.
Add `mystaredia.de` as a custom domain. The zone `mystaredia.de` must be on Cloudflare.

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

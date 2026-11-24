## 7.0.0 — Mizanora Net TV (3D streaming web app) + Netlify deployment

### 🌟 PRODUCT PIVOT: Mizanora Net TV
- Rebrand: `Mizanora IPTV` panel becomes **Mizanora Net TV** (MIZANORA.NET) — 3D animated
  streaming web app: **Live TV + Movies + Series + Songs**, mobile-app-style bottom tab bars,
  per-device responsive layouts. Xtream paid panel system deprecated (back-office kept working).
- Siravex player: movies/series play on `siravex.netlify.app/play/tt<imdbId>` in a 3D modal;
  live TV keeps the bundled intro/HLS player. `recommendedPlayer` → Siravex. IMDb catalog
  (2000+ movies, 400+ series) with OMDb posters (`experience.imdbApiKey`) + admin poster field.
- Songs: free iTunes Search API — search, artist chips, preview playback with animated
  equalizer + persistent mini player. No key, no cost.
- 3D design layer (`nettv.css`/`nettv.js`): aurora hero, tilt cards, channel tune-in splash,
  ad slots (`experience.adsenseId` auto-injects AdSense), premium glow, light/dark themes.
- Google/email login via Firebase Auth bridge. Premium 100 PKR/month JazzCash 0306-2015326:
  screenshot → agent verify → Orders approve → auto-UNLOCK.
- SEO: `sitemap.xml`, `/blog`, `/about`, `experience.verification` → `google-site-verification`
  meta (admin Search Console verify). Traffic tracking + live stats in admin (existing).

### 🚀 DEPLOYMENT: Vercel removed → hybrid Firebase Hosting + Netlify
- Site = Firebase Hosting (free, no card). API = **Netlify Functions** (free tier) —
  `netlify/functions/app.mjs` adapter serves `/api/{embed,panel,portal,stream,xtream}` with the
  routing table moved to `routing.json` (shared by dev server, Cloud Function build + Netlify).
- `vercel.json` deleted → `netlify.toml` + `routing.json`. `docs/VERCEL.md` → `docs/NETLIFY.md`.
  Player playout doc: `docs/PLAYOUT.md`. Product guide: `docs/NETTV.md`.
- `api-base.js` hybrid bridge unchanged — set `DEFAULT_BASE` to the Netlify URL after deploy.

## 6.2.1 — Billing-free Firebase hybrid (no credit card)

- FREE deploy mode with zero billing: Firebase Hosting (Spark plan) serves the site while the API runs on free Vercel — `public/assets/js/api-base.js` bridges `/api/*`, Xtream (`player_api/get/xmltv`), `/live|movie|series`, MAG (`portal.php`, `stalker_portal`, `/c/portal.php`), signed `/s/*` and `/playout/*` to a configurable remote base (same-origin mode stays a no-op).
- `?api=` URL override (persisted) for testing hybrid mode; MAG portal page displays the API base URL when configured.
- Workflow `MZ_NO_FUNCTIONS` repo variable skips the Cloud Functions deploy for billing-free setups while hosting + database rules still publish; clear notice points to the docs.
- Workflow auto-enables required Google Cloud APIs (best effort) and deploys hosting + database before functions so the site stays live during partial failures.
- Docs: one-time API enable links, Service Usage Admin tip and billing-free setup guide.

## 6.2.0 — Firebase publish + site refresh

- Firebase Hosting + Functions publish: `firebase.json`, `.firebaserc`, generated functions bundle (`scripts/build-functions.mjs`) and one-command `npm run deploy:firebase` — website, Xtream/MAG/stream API routes and database rules deploy together on `mizanoranet`.
- GitHub Actions workflow: test suites on every push/PR, automatic `hosting,functions,database` deploy on `main`, and 7-day Hosting preview channels for pull requests.
- Shared handlers run natively on Cloud Functions: `req.rawBody` parsing, metadata-server auth fallback for RTDB, durable-write enforcement on serverless runtimes and internal module path blocking.
- Public site refresh: aurora hero, glass cards, gold-sheen buttons, animated ticker, device grid, customer reviews, FAQ accordion, closing CTA band, Sora/Manrope typography, light + dark themes.
- New UI behaviours: mobile hamburger menu, scroll progress bar, back-to-top, scroll-reveal with reduced-motion support, animated counters and auto footer year.
- Performance: font preconnect with `display=swap`, priority hero logo, lazy images, `content-visibility` below the fold, immutable asset caching and `no-cache` HTML.

## 6.1.2 — Reconnect intro-loop fix

- Resume recent authenticated Xtream/M3U entries instead of creating a new intro on every reconnect.
- Retire played intro segments once the live window has sufficient duration; remove the start-at-zero hint after the intro window.
- Preserve media/discontinuity sequences across reconnects and invalidate old generation tokens after a genuine idle retune.
- Website Retry reconnects without replaying its already-shown intro.
- Add reconnect, concurrent retry, player identity and generation-isolation regression coverage.

## 6.1.1 — Playback reliability

- Fix false-offline handling for fractional EXTINF values, declared target durations, provider probe restrictions and incompatible stitching formats.
- Publish intro/live buffers upfront; preserve delayed-refresh segments; pin/coalesce source discovery with bounded caching and retry grace.
- Add automatic original-source compatibility and per-channel Direct mode.
- Extend new playback capabilities to seven days with rolling idle cleanup and password-change revocation; keep short owner previews.
- Add bounded browser recovery, guide-availability notices across XMLTV/short EPG/public guide, and simulated 72-hour stability tests.

## 6.1.0 — 2026-11-03

- Vercel-native HLS manifest playout enabled by default for compatible live sources: eight-second intro, live media, offline recovery, recharge and coming-soon loops.
- Durable Firebase ETag/CAS session timelines, bounded media windows, expiry cleanup, explicit AES-128 IV preservation and authenticated playlist refreshes.
- MPEG-TS `.ts` aliases for external-player compatibility; bounded master resolution and segment probes.
- Owner Broadcast Studio with signed playback previews and manifest inspection; responsive graphite/emerald/gold dashboard redesign.
- Serverless HLS integration/reducer tests and real FFmpeg stitched-media decoding.

## 6.0.0 — 2026-11-03

- Added opt-in VPS HLS gateway: dynamic branded intro, live transcoding, offline failover, subscription rechecks, bounded sessions, Docker deployment and real-FFmpeg integration tests.
- Added Academy DOM regression tests.

- Secure reseller login usernames, scrypt credentials, revocable sessions and client username/password changes.
- Stable channel numbering, persisted sorting, EPG mapping and bounded source probes.
- Searchable movie/series management and public catalog with honest availability labels.
- `/c/` MAG setup and authenticated Stalker protocol actions.
- Embedded owner/reseller Academy with checklists and quizzes.
- Replaced all four bundled broadcast cards with animated eight-second MP4/HLS files and posters; dynamic website channel/payment overlays.
- Added regression coverage for session invalidation, client renames and MAC-bound portal pagination.

# Changelog

## 5.1.2 — 2026-11-02

- Add a direct channel number / playlist-position field to channel create and edit; ordering stays synchronized across the public list, M3U, Xtream and MAG outputs while stream IDs remain stable.
- Add sortable movie and series views by title, release year, rating and playable status.
- Keep the new admin controls responsive and keyboard-accessible.

## 5.1.0 — 2026-11-02

- Add reseller business reports, activity history and upcoming-expiry dashboard.
- Give owner reseller report, suspension and reactivation controls.
- Scope reports per reseller, exclude passwords from client lists and validate top-ups.
- Add integration guidance for a separate website backend and animated README banner.
- Prevent client-supplied start dates from overriding reseller plan dates.


## 5.0.0 — 2026-11-02

### Added

- Configurable welcome intro before secure channel fetch, with skip, timeout, retry and cancellation handling.
- Animated channel catalog, premium/recharge states and reduced-motion support.
- Mizanora Welcome & Promo Live channel using bundled media.
- Search, category filters and progressive channel rendering.
- M3U file/URL imports with metadata parsing, duplicate-safe merging and playlist history.
- XMLTV file/URL imports, multiple EPG sources, refresh/delete and now/next web guide.
- Xtream short EPG responses and programme-rich authenticated XMLTV output.
- Public recharge contact lookup and dedicated reseller dashboard.
- Reseller registration/login, clients, credits, pricing, payments, ledger and key rotation UI.
- Dynamic developer guide, configurable website embed and clean `/reseller`, `/developers`, `/guide` routes.
- Vercel, M3U/EPG and reseller documentation.

### Fixed

- Corrected bundled HLS playlists to reference existing `.m2ts` segments instead of missing `.ts` files.
- Settings validation for intro URLs, durations, toggles and contact text.
- Guide lookup uses indexed programme mapping for imported catalogs.
- XMLTV output maps exact channel-name fallbacks, preserves programme dates and avoids orphan channel declarations.
- M3U `x-tvg-url` keeps `&password=` intact for player EPG authentication.
- Imported categories receive valid numeric Xtream category mappings.
- Escape/cancel closes the player with the same cleanup as the close button; intro progress follows configured duration.
- Remote imports enforce size/time limits and production private-network protections, including mapped-IP forms.

### Notes

- IMDb metadata-only titles still require licensed stream URLs.
- Browser playback depends on upstream HTTPS/CORS support.
- Durable Vercel writes still require Firebase service-account configuration.

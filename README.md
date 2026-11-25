# 📺 Mizanora Net TV — Streaming Web App & Broadcast Suite v7.0.0

![Animated Mizanora Net TV reseller suite banner](docs/assets/reseller-suite.gif)

**Owner control → reseller workspace → client service**

[Quick start](#run-and-verify-locally) · [Reseller API](docs/RESELLER.md) · [Firebase Deploy](docs/FIREBASE.md) · [Changelog](CHANGELOG.md)

**Live TV, animated welcome intro, M3U imports, XMLTV guides, Xtream Codes, MAG/Stalker, owner admin, reseller workspace and website integrations.** A **Mizanora Projects** product by **Muaaz Iqbal** (Kasur, Punjab, Pakistan).

## What's new in v6.2

- **Firebase Hosting + Functions publish:** `firebase.json`, generated Functions bundle and one-command `npm run deploy:firebase` deploy website + API + database rules to `mizanoranet` — GitHub Actions auto-deploy on `main`, PR preview channels, plus [the full guide](docs/FIREBASE.md).
- **Refreshed public site:** aurora hero, glass cards, gold-sheen buttons, animated ticker band, device grid, customer reviews, FAQ accordion and a closing CTA band — Sora/Manrope type, light + dark themes, scroll-reveal motion with `prefers-reduced-motion` support.
- **Faster pages:** font preconnect + `display=swap`, priority hero logo, lazy footer image, `content-visibility` below-the-fold sections and immutable asset caching.
- **Small upgrades:** mobile hamburger menu, scroll progress bar, back-to-top button, animated stat counters and auto-updating footer year.

## What's fixed in v6.1.2

- Recent Xtream/M3U reconnects resume the current timeline instead of restarting the intro.
- Already-played intro segments retire from live playlists; website Retry skips the intro.
- Transactional session generations prevent stale URLs attaching to a later retune.

## What's fixed in v6.1.1

- Stop false offline transitions from target-duration rounding, server-only segment probes and unsupported stitching formats.
- Prebuffer intro/live media; preserve missed segments on delayed reload; pin/cache rendition discovery and tolerate transient manifest failures.
- Automatically preserve the original provider stream for unsupported formats, with a per-channel Direct override.
- Seven-day playback capabilities, rolling six-hour idle cleanup and credential-change invalidation; no four-hour cutoff for new sessions.
- Every channel gets explicit availability notices in EPG gaps, without fabricated programming.
- See [research, compatibility boundaries and validation](docs/PLAYBACK-RELIABILITY.md).

## What's new in v6.1

- **Serverless HLS playout** with a durable, concurrency-safe media sequence and no long-running video process.
- **Broadcast Studio** with real playback previews, manifest inspection and a redesigned responsive owner workspace.
- **Rotating offline, recharge and cinema loops**, plus automatic live-source recovery for compatible feeds.
- Real HTTP, FFmpeg decode and local Chromium playback checks.

## What's new in v6

- Reseller usernames/passwords, scrypt hashing, 12-hour browser sessions and client credential editing.
- Stable channel numbers, saved sorting, source health checks and explicit XMLTV mapping.
- Movie/series category filters, pagination, playable-only filters and saved catalog order.
- MAG setup at `/c/`, authenticated Stalker actions at `/c/portal.php`.
- Seventeen practical Academy lessons at `/academy`, also available inside both panels.
- Replaced bundled videos: eight-second Mizanora intro, offline, recharge and cinema cards in MP4/HLS. Channel identity and configured payment/contact details are overlaid by the website.

See the [v6 operations guide](docs/V6-OPERATIONS.md) for setup, migration, verification and limitations. The new default [serverless HLS playout](docs/PLAYOUT.md) stitches compatible live HLS with intro/offline/recharge/coming-soon segments, without a VPS. The optional [encoder gateway](docs/MEDIA-GATEWAY.md) remains available for transcoding.

## What's new in v5.1

- **Owner reseller control:** view individual business reports and suspend/reactivate access from Admin → Resellers.
- **Reseller insights:** credit and collection totals, client statuses, seven-day expiry list and recent business activity in the dealer panel and API.
- **Safer integrations:** scoped reports, password-free client lists, protected owner actions and validated credit top-ups.
- **Website ready:** owner and dealer API examples for a private backend, including use with your own Mizanora website.

## What's included from v5

- **Intro → secure fetch → channel playback:** configurable MP4/HLS welcome video, duration, skip control, retry and stale-request cancellation.
- **Welcome & Promo Live:** bundled local promo channel and corrected HLS segment paths.
- **M3U import:** local `.m3u/.m3u8` upload or remote URL, logos/groups/tvg-id parsing, duplicate-safe merge, stable stream IDs and import history.
- **XMLTV EPG:** file/URL import, multiple sources, refresh/delete, common programme metadata, public now/next guide, Xtream short EPG and authenticated XMLTV output.
- **Reseller panel:** registration/login, credits, clients, renew/suspend/delete, credentials, pricing, payment ledger and key rotation.
- **Recharge and contact:** existing users find their reseller or Mizanora support by username.
- **Developer guide:** dynamic copyable embed/API examples at `/developers` and `/guide`.
- **Motion with accessibility:** channel/hero/premium animations respect `prefers-reduced-motion`.

## Run and verify locally

```bash
npm install
npm run dev       # http://localhost:3000 (binds 0.0.0.0)
npm test          # HTTP/API + admin/public/reseller/guide/embed DOM interaction suites
```

Local development can use `/tmp/mizanoranettv-rtdb-mirror.json` when Firebase is unreachable. This is only a development fallback and is never treated as durable production storage.

## Main surfaces

| Surface | Route | Functionality |
|---|---|---|
| Public site | `/` | Animated channel catalog, intro player, guide, trial, order and recharge |
| TV guide | `/#guide` | Now/next XMLTV programmes and channel information |
| Owner admin | `/admin` | 14 sections including M3U import, EPG sources, clients, orders, settings and keys |
| Reseller panel | `/reseller` | Full self-serve dealer workspace |
| Developer guide | `/developers`, `/guide` | Embed builder, integration snippets and deployment help |
| Public/embed API | `/api/embed`, `/embed.js` | CORS-enabled config/channels/guide/catalog/preview and website widget |
| Panel API | `/api/panel?action=help` | Public, reseller and owner actions |
| Xtream Codes | `/player_api.php`, `/get.php`, `/xmltv.php` | Login, categories/lists/info, short EPG, M3U and XMLTV |
| Streams | `/live/…`, `/movie/…`, `/series/…`, `/s/<token>` | Credential checks and 15-minute signed playback |
| MAG / Stalker | `/portal.php`, `/stalker_portal/server/load.php` | Handshake, MAC profile, channels and `create_link` |

## Firebase-only setup

Mizanora Net TV ab **sirf Firebase** par deploy hoti hai (Hosting + Functions + Realtime Database).

1. Firebase Console → project **mizanoranet** → Hosting, Functions, Realtime Database enable karein.
2. **Service account**: Project settings → Service accounts → Generate new private key. JSON ko GitHub secret `FIREBASE_SERVICE_ACCOUNT` mein add karein (ya `FIREBASE_SERVICE_ACCOUNT_JSON` env var).
3. **Auth**: Firebase Authentication → Google enable karein. Admin/owner email: `matrader890@gmail.com`.
4. **Env/secrets**: `FIREBASE_DATABASE_URL`, `MZ_OWNER_PIN`, `MZ_SESSION_SECRET`, `MZ_STREAM_SECRET` set karein.
5. **Deploy**:

```bash
npm test                  # all suites green
npm run deploy:firebase   # hosting + functions + database rules
```

GitHub Actions (`.github/workflows/firebase-deploy.yml`) `main` push par test + deploy karta hai. Agar Cloud Functions billing/APIs abhi enable nahi hain, workflow hosting+database deploy karega aur functions step par clear warning dega; `MZ_NO_FUNCTIONS=1` repo variable se functions intentionally skip bhi kar sakte hain.

See [docs/FIREBASE.md](docs/FIREBASE.md) for details.

## M3U and EPG

### Channels

Open **Admin → Channels → M3U channel import**:

- Upload a local file (up to 5 MB) or enter an absolute HTTP(S) playlist URL.
- `EXTINF`, `EXTGRP`, `tvg-id`, `tvg-name`, `tvg-logo`, `group-title`, language/country and `x-tvg-url` are parsed.
- Matching channels update without duplicating; new channels get unique numeric stream IDs for Xtream.
- Select the default Free/PRO tier for newly imported channels.
- Optionally import up to two linked XMLTV URLs. Channel import remains successful if an optional linked EPG fails; the warning is shown separately.

### TV guide

Open **Admin → EPG Guide** to import XMLTV from a file or URL. Remote gzip responses are supported. Each source can be refreshed or deleted independently. Match channel `epgId` to XMLTV `channel id` / M3U `tvg-id`; exact channel-name matching is a fallback.

Common XMLTV fields include title, sub-title, description, category, icon, episode number, date, rating, new and premiere. Programmes with invalid channel/start/stop values are skipped. Limits and large-file guidance are in [docs/M3U-EPG.md](docs/M3U-EPG.md).

## Reseller business

Open `/reseller` or use **Admin → Resellers → Create**. Dealers can login with code + password or their `mzr_` API key. Credentials are kept in browser session storage, not persistent local storage.

The dealer panel supports client creation, MAG MACs, credits, one-month renewals, suspension/reactivation, deletion, credential retrieval, payment recording, retail pricing, ledger and immediate API-key rotation. Plan months determine server-side credit cost; client-supplied prices cannot reduce it.

See [docs/RESELLER.md](docs/RESELLER.md) for workflow, API examples and production limitations. **Never put `mzr_` or `mzk_` keys in public browser code.** Use a backend proxy.

## Owner/content notes

- New admin API keys and rotated reseller keys are shown once. Revocation uses public key IDs; hashes are not returned to browsers.
- A username or MAC cannot overwrite another client. Orders can only be reviewed once.
- Public account resolution requires the correct password. Unknown stream IDs/MACs never fall back to unrelated channels.
- The repository includes default live channels plus IMDb movie/series metadata. **Metadata is not a video stream.** Configure licensed movie/episode URLs in Admin; unconfigured titles remain `Metadata only`.
- Only import/stream content you own or have permission to distribute. Upstream availability, HTTPS and CORS policies are controlled by the provider.
- Xtream playback redirects authenticated clients to the configured source; the source URL is therefore visible to clients. Select HLS/M3U8 output in the player for HLS sources. This service does not transcode HLS to MPEG-TS, and the player's format support and the provider's availability still determine playback.

## Tests

```bash
npm test
npm run test:dom
npm run test:site
npm run test:reseller
npm run test:guide
```

The suites cover real HTTP flows (imports, EPG, public/admin/reseller, Xtream, signed playback, MAG, validation and CRUD) and jsdom click-throughs against the actual frontend JavaScript. Tests use an isolated local mirror; production Firebase is not required. Real browser playback and live Firebase behavior still need deployment-environment verification.

## Playback and channel management

- **Website player:** each channel selection starts the welcome video (8 seconds by default) with the selected channel name and loading indicator, then loads that channel. Retry reconnects without repeating the already-shown intro. Browsers may block autoplay, and an intro load error advances to the channel. In **Admin → Settings**, change the intro URL/duration and enable or disable the skip button. Existing saved settings take precedence over the new defaults; set the duration to 8 and enable the intro there if an older installation still uses another value.
- **Website fallback videos:** a detected playback error shows the configured offline video and retry button. A PRO-only public preview displays the configured unlock/recharge video and trial link. The Movies & Series section can play the coming-soon announcement.
- **Xtream/M3U/MAG:** compatible live HLS uses serverless playout: eight-second intro → source media, with offline/frozen-source detection and recovery. Expired authenticated live links play a recharge loop; missing movie/episode streams play a coming-soon loop. All three cards are rotating live playlists, not finite VOD files. Actual configured movie/episode URLs remain direct playback. New expired logins remain disabled.
- **Admin → Broadcast Studio:** private signed previews of the real HLS engine, channel selector, four broadcast cards and a live manifest inspector.
- **Admin → Channels:** add, edit (including visibility, EPG ID, access and an exact 1-based channel number / playlist position), delete, and move channels up/down. Saved ordering is used by the public channel list, M3U, Xtream and MAG outputs; numeric stream IDs stay stable when you reorder.
- **Admin → Movies / Series:** search the catalog and sort results by title, release year, rating or playable status before managing licensed stream URLs.
- Configure video URLs under **Admin → Settings**. Use supported formats and reliable HTTPS sources; external videos used in the browser also need CORS. Website custom videos are separate from the bundled serverless broadcast package.

**Format boundary:** The serverless playout assembles manifests; it does not transcode frames. The playout path supports muxed MPEG-TS HLS, clear/AES-128. fMP4, DRM, byte-range, separate audio or non-HLS sources need direct mode or an encoder. Browser CORS and player codec support still matter. See [setup and tested behavior](docs/PLAYOUT.md).

### Rebuild branded videos

The bundled 8-second welcome, offline, recharge and coming-soon cards contain the Mizanora logo and WhatsApp support number. Their audio is a synthesized ambient tone, not narration. The number is rendered into the videos; changing the admin support setting does not change these files. To update the branding or number, edit `scripts/build-brand-videos.sh` and run it with FFmpeg (libx264/AAC), ImageMagick and DejaVu fonts installed:

```bash
scripts/build-brand-videos.sh
```

The script regenerates the MP4s and corresponding four HLS segments for each video. Existing custom URLs saved in Admin → Settings still take precedence over these bundled defaults.

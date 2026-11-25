# 🎬 Mizanora Net TV — Product & Operations Guide (v7)

**Mizanora Net TV** — Mizanora Projects ka premium streaming web app: **Live TV, Movies,
Series aur Songs**, 3D animations, mobile-app-style interface, Siravex player, aur
Firebase-only hosting (Firebase Hosting + Functions + RTDB).

Founder: **Muaaz Iqbal** · Kasur, Punjab, Pakistan · a project of **Mizanora Projects**.

## Kya-kya hai

| Feature | Detail |
|---|---|
| 📺 **Live TV** | Admin panel se M3U/M3U8 import, categories, sorting, free/PRO tiers |
| 🎬 **Movies & Series** | 2000+ IMDb catalog (tt IDs), search/filter/sort, **Siravex player** (`slast430did.com/play/tt{id}`) |
| 🎵 **Songs** | Free music API (iTunes Search) — search + previews, animated equalizer |
| 🎞️ **3D animations** | Hero 3D, card tilt/glow, channel tune-in splash, movie play splash, aurora gradients |
| 📱 **Responsive app UI** | Mobile bottom tab bar (Home/Live/Movies/Songs/Premium), desktop top nav |
| 🔐 **Login** | Google + email login (Firebase Auth) |
| 👑 **Premium 100 PKR/month** | JazzCash 0306-2015326 → screenshot bhejein → agent verify karke auto-unlock |
| 📈 **Tracking** | Traffic sources, events, live viewers (Admin → Analytics) |
| 📰 **Blog + About + SEO** | `/blog`, `/about`, `sitemap.xml`, Search Console verification (admin se) |
| 📢 **Ads** | AdSense-ready slots — admin se ad client ID configure |
| 🎨 **Themes** | Dark + light, persisted |

## Premium unlock flow (100 PKR)

1. User **Get Premium** dabata hai → JazzCash/EasyPaisa **0306-2015326** par Rs 100 bhejta hai.
2. Screenshot WhatsApp par (`0306-2015326`) — ya order form submit karta hai.
3. **Agent** screenshot verify karta hai (Admin → Orders) → approve → account auto-PRO.
4. PRO login se premium channels/movies unlock ho jate hain.

## Admin panel kahan hai

`/admin` (owner login: Google `matrader890@gmail.com` ya owner PIN).

- **Channels** — M3U/M3U8 import (file/URL), sort, edit, free/PRO tier, channel numbers.
- **Broadcast Studio** — serverless HLS playout preview, manifest inspection.
- **EPG** — XMLTV sources, now/next guide.
- **Orders / Clients** — trial requests, orders, payments, expiry, suspension.
- **Settings** — branding, payment details, intro/offline/recharge videos, announcement.
- **Analytics** — public traffic, events, sources.

## Advanced settings (API se)

`/api/panel?action=admin/settings-save` ke `experience` object mein ye keys set kar sakti hain:

| Key | Kaam |
|---|---|
| `experience.verification` | Search Console meta content (`google-site-verification=...`) — site `<head>` mein auto-inject |
| `experience.adsenseId` | AdSense publisher ID (`ca-pub-...`) — ad slots activate |
| `experience.imdbApiKey` | OMDb API key (free) — movie posters auto-load by `imdbId`; warna designed title cards |

## Player — Siravex

Movies/Series play karne par **Siravex player** embed hota hai:
`https://slast430did.com/play/tt<imdbId>` — Siravex player embed, 3D animated playback experience,
zero install. Live TV bundled player (intro + secure streams) use karta hai.

## Deployment

- **Website** → Firebase Hosting — [FIREBASE.md](FIREBASE.md)
- **API** → Firebase Cloud Functions
- **Data** → Firebase Realtime Database
- GitHub Actions: har `main` push par tests + Firebase deploy.

## Architecture notes

- Routing truth: `routing.json` (shared by local dev server, Firebase Functions `functions/`).
- HLS playout engine: [PLAYOUT.md](PLAYOUT.md) — intro + live + offline/recharge loops.
- Catalog seeds: `data/imdb-catalog-2000.js` (2000+ IMDb titles with `imdbId` tt-IDs).
- Public API: `/api/embed` (config, channels, guide, movies, series, stream, trial, order).

---

**Mizanora Projects** · world-class AI engineering + Muaaz Iqbal ki soch · WhatsApp 0306-2015326

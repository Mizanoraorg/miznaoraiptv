# 🟢 Netlify — API Deploy Guide (free, no billing)

**Mizanora Net TV ka API (catalog, panel, streams, playout) Netlify free tier par chalta hai.**
Static website Firebase Hosting par hai ([FIREBASE.md](FIREBASE.md)) — dono mil kar billing-free
hybrid banate hain. `netlify.toml` + `netlify/functions/app.mjs` repo mein ready hain.

## 1. Site create (ek dafa, 2 minute)

1. [app.netlify.com](https://app.netlify.com) → free account (email/GitHub — **credit card ZERO**).
2. **Add new site → Import an existing project** → GitHub → `Mizanoraorg/miznaoraiptv` select karein.
3. Netlify `netlify.toml` khud padh leta hai — build settings chhune **nahi**. **Deploy** dabayein.
4. Deploy hone par site URL milega, misaal: `https://mizanora.netlify.app`

## 2. Environment variables (Site settings → Environment variables)

| Variable | Kyun |
|---|---|
| `FIREBASE_DATABASE_URL` | `https://mizanoranet-default-rtdb.firebaseio.com` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Poora service-account JSON (Firebase Console → Service accounts → Generate new private key). Durable writes ke liye zaroori. |
| `MZ_OWNER_PIN` | Strong owner PIN |
| `MZ_SESSION_SECRET` / `MZ_STREAM_SECRET` | Random long strings (session/stream signing) |
| `MZ_REQUIRE_PERSISTENCE` | `1` — writes fail loudly agar RTDB unreachable (recommended) |

## 3. Website ko API se jodein

`public/assets/js/api-base.js` → `DEFAULT_BASE` mein apna Netlify URL:

```js
var DEFAULT_BASE = "https://mizanora.netlify.app"; /* ← apna Netlify URL */
```

Ye bridge saari API calls (`/api/*`, Xtream `player_api/get/xmltv`, `/live|movie|series`,
MAG `portal.php/stalker_portal/c`, signed `/s/*`, `/playout/*`) Netlify par bhej deti hai.
Testing: `https://<firebase-site>/?api=https://your-netlify-url` (localStorage mein save hota hai).

## 4. Routing map (netlify.toml)

| Route | Kahan | Handler |
|---|---|---|
| `/`, `/admin`, `/reseller`, `/academy`, `/developers`, `/guide`, `/c` | Netlify static + Firebase Hosting | `public/*.html` |
| `/api/**` | Function `app` | shared `api/*.js` |
| `/player_api.php`, `/get.php`, `/xmltv.php` | Function `app` | `api/xtream.js` |
| `/live/**`, `/movie/**`, `/series/**` | Function `app` | `api/xtream.js` |
| `/s/<token>`, `/playout/**` | Function `app` | `api/stream.js` |
| `/portal.php`, `/stalker_portal/**`, `/c/**` | Function `app` | `api/portal.js` |
| `/media/*/seg*.ts` | Function `app` → 302 | hosted `.m2ts` |

Routing truth `routing.json` mein hai — local dev server, Firebase Functions aur Netlify Function teeno wahi table share karte hain.

## 5. Verification

- [ ] `https://<netlify-url>/api/embed?action=health` → `ok: true`
- [ ] `https://<netlify-url>/get.php?username=X&password=Y` → `#EXTM3U`
- [ ] `https://<netlify-url>/player_api.php?...` → Xtream JSON
- [ ] Website (Firebase) se channels/movies load hon (`?api=` bridge ke saath)
- [ ] Netlify → Functions logs saaf hon

## 6. Free tier limits (Netlify)

125K function requests/month, 100GB bandwidth/month, 10s function execution — shuru ke liye kaafi.
Bada traffic aaye to paid tier ya multi-host.

## 7. Troubleshooting

| Problem | Solution |
|---|---|
| Function 500 | Site settings → Functions → logs dekhein. Env vars (`FIREBASE_SERVICE_ACCOUNT_JSON`) set hain? |
| `Firebase save failed` | Service account JSON valid hai? RTDB rules publish hain? `MZ_REQUIRE_PERSISTENCE=1` strict mode hai. |
| Website se API 404 | `api-base.js` `DEFAULT_BASE` mein Netlify URL set hai? `?api=` se test karein. |
| Deploy nahi ho raha | `netlify.toml` root mein hai? Functions tab mein `app` function dikh raha hai? |

---

**Mizanora Projects** · Founder: Muaaz Iqbal · Kasur, Punjab, Pakistan · WhatsApp 0306-2015326

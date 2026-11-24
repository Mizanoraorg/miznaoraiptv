# 🔥 Firebase Hosting + Functions — Complete Deploy Guide (v6.2)

**Mizanora IPTV ab Firebase par puri tarah publish hoti hai** — website (Hosting),
API/Xtream/MAG routes (Functions) aur database rules — sab ek `firebase deploy` se.

> Vercel support jaisa ka waisa hi rehta hai (`vercel.json` intact) — dono chal sakte hain.
> Firebase Hosting static files serve karta hai aur `functions` app (`app` HTTPS function)
> wahi shared `api/*` handlers chalata hai jo Vercel aur local dev par use hote hain.

---

## 1. Ek dafa ka Firebase Console setup

1. [Firebase Console](https://console.firebase.google.com/) → project **mizanoranet** kholein.
2. **Build → Hosting → Get started** → project select karein (region koi bhi).
3. **Realtime Database** pehle se hai (`mizanoranet-default-rtdb`) — rules publish honge.
4. **Google Cloud APIs enable karein** (ek dafa, project owner ke account se — ek click each):
   - [Cloud Functions API](https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=mizanoranet)
   - [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=mizanoranet) ← deploy error isi ki wajah se aata hai
   - [Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=mizanoranet)
   - [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com?project=mizanoranet) (2nd gen functions ke liye)
5. **Project settings → Service accounts → Generate new private key** — ye JSON file
   GitHub secret banegi (neeche dekhein). **Is file ko kabhi Git mein commit na karein.**
6. (Optional) **Authentication → Sign-in method → Google** enable karein aur
   `mizanoranet.web.app`, `mizanoranet.firebaseapp.com` + apna custom domain
   **Authorized domains** mein add karein (admin Google login ke liye).

> **Tip:** service account ko `Service Usage Admin` role de dein to CI khud APIs enable
> kar leta hai (step 4 zaroori nahi rehti). Roles: **IAM → Service accounts →** account
> edit → `Service Usage Admin` + `Cloud Functions Admin` + `Cloud Run Admin` +
> `Artifact Registry Writer` + `Service Account User` + `Storage Admin`.

## 2. 🆓 FREE setup — billing ke bagair (Spark plan, credit card ZERO)

> **Google Cloud Functions/Cloud Run/Cloud Build ke liye billing account chahiye** (Blaze plan).
> Paisa/koi card nahi? Koi masla nahi — **100% free hybrid** chalega:
>
> **Firebase Hosting (free Spark)** = website · **Netlify (free)** = API · **Firebase RTDB (free)** = data

### Setup (ek dafa)

1. **Netlify par API deploy karein** (free, card nahi chahiye) — [docs/NETLIFY.md](NETLIFY.md) follow karein.
   Deploy hone ke baad Netlify URL milega, misaal: `https://mizanora.netlify.app`
2. **`public/assets/js/api-base.js`** kholein aur pehli line set karein:
   ```js
   var DEFAULT_BASE = "https://mizanora.netlify.app"; /* ← apna Netlify URL */
   ```
   Ye bridge saari API calls (`/api/*`, `player_api.php`, `get.php`, `xmltv.php`, `/live|movie|series`,
   `portal.php`, `stalker_portal`, `/s/*`, `/playout/*`) us Netlify URL par bhej degi.
3. **GitHub → Settings → Secrets and variables → Actions → Variables** → New variable:
   - Name: `MZ_NO_FUNCTIONS` · Value: `1`
   (workflow Cloud Functions skip karega — hosting + database rules phir bhi deploy hoti hain)
4. Commit + push (ya PR merge) — **site `mizanoranet.web.app` par live!**
5. Xtream/MAG links API responses se automatically Netlify domain par aate hain — apps mein wahi use hon.

### Notes

- **Testing:** `https://mizanoranet.web.app/?api=https://your-netlify-url` se bina file badle hybrid test kar sakte hain (localStorage mein save hota hai; hatane ke liye `?api=` khali use karein).
- **MAG portal page** (`/c/`) hybrid mode mein portal URL API base ka dikhata hai.
- **Custom domain** Firebase Hosting par add karein to woh bhi static site serve karega (API base wahi rahega).
- **Billing kabhi on karein?** `MZ_NO_FUNCTIONS` variable hata dein + `npm run deploy:firebase` — pura Firebase stack (Functions samet) live ho jayega, api-base.js `DEFAULT_BASE = ""` kar dein.

## 3. GitHub Actions — automatic deploy (recommended)

Workflow: `.github/workflows/firebase-deploy.yml` — sab kuch cover karta hai:

| Job | Kab chalta hai | Kya karta hai |
|---|---|---|
| `test` | har push + har PR | `npm test` (HTTP/API + saare DOM suites) |
| `deploy` | `main` push + manual dispatch | `firebase deploy --only hosting,functions,database` |
| `preview` | har pull request | 7-din ka Firebase Hosting preview channel |

**Setup:** GitHub repo → **Settings → Secrets and variables → Actions** →
New secret:

- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: service-account JSON file ka **poora content** (step 1.4 mein download hui file).

Bas! Ab `main` par push karte hi website + API + rules live ho jate hain.

## 4. Manual deploy (laptop se)

```bash
npm install
npm test                    # sab suites green honi chahiye
npm run deploy:firebase     # hosting + functions + database rules
```

Sirf static website update karni ho:

```bash
npm run deploy:hosting
```

Login pehli dafa: `npx firebase-tools@13 login` (browser khulta hai).

## 5. Functions environment (durable writes)

`functions/` folder ka `.env.example` dekhein. Production ke liye
`functions/.env` banayein (ya Google Cloud console env vars set karein):

```env
FIREBASE_DATABASE_URL=https://mizanoranet-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON={...poora service account JSON...}
MZ_OWNER_PIN=<strong-pin>
MZ_SESSION_SECRET=<random-long-string>
MZ_STREAM_SECRET=<random-long-string>
MZ_REQUIRE_PERSISTENCE=1
```

- Agar service account set nahi hai, function **metadata server** se token leta hai
  (zero-config) — lekin explicit service account sab se reliable hai.
- `K_SERVICE` (Cloud Functions) par `/tmp` mirror kabhi durable nahi mana jata —
  Vercel jaisa hi behavior.

## 6. Kya deploy hota hai (routing map)

| Route | Firebase par | Handler |
|---|---|---|
| `/`, `/admin`, `/reseller`, `/academy`, `/developers`, `/guide`, `/c` | Hosting (static + clean URLs) | `public/*.html` |
| `/api/**` (embed, panel, stream) | Function `app` | `api/*.js` (shared) |
| `/player_api.php`, `/get.php`, `/xmltv.php` | Function `app` | `api/xtream.js` |
| `/live/**`, `/movie/**`, `/series/**` | Function `app` | `api/xtream.js` |
| `/s/<token>` (signed playback) | Function `app` | `api/stream.js` |
| `/portal.php`, `/stalker_portal/**`, `/c/**` | Function `app` | `api/portal.js` |
| `/playout/**` (HLS playout) | Function `app` | `api/stream.js` |
| `/media/*/seg*.ts` (MPEG-TS alias) | Function `app` → 302 | hosted `.m2ts` segment |

Rewrite table **generated** hoti hai `vercel.json` se (`npm run build:functions`)
— routing ki single source of truth wahi hai, dono platforms consistent rehte hain.

## 7. Custom domain

1. Firebase Console → **Hosting → Add custom domain** (e.g. `miznaoraiptv.com`).
2. Firebase jo DNS records (A/AAAA ya CNAME) dikhaye, apne registrar par add karein.
3. SSL automatic provision hota hai (Let's Encrypt).
4. Domain ke liye `getRequestBaseUrl()` headers ke zariye sahi base URL return karta hai —
   koi extra config nahi.

## 8. Verification checklist

- [ ] `https://<site>/` — landing page + channels load
- [ ] `https://<site>/api/embed?action=health` — `ok: true`
- [ ] `https://<site>/api/embed?action=channels` — catalog JSON
- [ ] `https://<site>/player_api.php?username=X&password=Y` — Xtream login JSON
- [ ] `https://<site>/get.php?username=X&password=Y` — M3U download
- [ ] `https://<site>/c/` — MAG/Stalker portal page
- [ ] Free trial form — credentials render hote hain (writes durable hon: health check `durableServerWrites: true`)
- [ ] GitHub Actions → last `Firebase Deploy` run green
- [ ] (Free hybrid) `https://<site>/?api=<netlify-url>` se channels load hon — api-base.js bridge set hai

## 9. Troubleshooting

| Problem | Solution |
|---|---|
| **`Cloud Functions deployment requires the Cloud Build API to be enabled`** | Project owner ye links open karke APIs enable karein: [Cloud Build](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=mizanoranet) · [Cloud Functions](https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=mizanoranet) · [Artifact Registry](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=mizanoranet) · [Cloud Run](https://console.cloud.google.com/apis/library/run.googleapis.com?project=mizanoranet). Phir GitHub Actions → failed run → **Re-run failed jobs**. (Ya service account ko `Service Usage Admin` role dein — CI khud enable kar lega.) |
| **`This API requires a billing account` / billing prompt** | Billing nahi chahiye! [Section 2 — FREE setup](#2--free-setup--billing-ke-bagair-spark-plan-credit-card-zero) follow karein: `MZ_NO_FUNCTIONS=1` + Vercel API base. |
| `deploy` job auth error | `FIREBASE_SERVICE_ACCOUNT` secret valid JSON hai? Re-generate key agar expire ho. |
| API 500 on `/api/*` | Functions logs dekhein: `npx firebase-tools@13 functions:log`. Env vars (`functions/.env`) missing honge. |
| `Firebase save failed` | Service account ko Realtime Database access do (IAM: `Firebase Realtime Database Admin`) ya rules publish karein. |
| Preview channel 404 on API | Pehli dafa `npm run deploy:firebase` se `app` function deploy karein — phir preview channels use karte hain. |
| Hosting 404 on `/admin` | `cleanUrls: true` + rewrites `firebase.json` mein hain — deploy `firebase.json` ke saath hi hua? |
| Functions fail but website live hai | Workflow pehle `hosting,database` deploy karta hai, phir `functions` — site publish ho jati hai, API routes functions deploy hote hi on ho jate hain. |

---

**Mizanora Projects** · Founder: Muaaz Iqbal · Kasur, Punjab, Pakistan · WhatsApp 0306-2015326

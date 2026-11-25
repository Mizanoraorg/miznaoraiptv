# 🔥 Firebase Hosting + Functions — Complete Deploy Guide (v6.2)

**Mizanora IPTV ab Firebase par puri tarah publish hoti hai** — website (Hosting),
API/Xtream/MAG routes (Functions) aur database rules — sab ek `firebase deploy` se.

> Firebase Hosting static files serve karta hai aur `functions` app (`app` HTTPS function)
> wahi shared `api/*` handlers chalata hai.

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

## 2. Firebase-only deploy

Mizanora Net TV ab **sirf Firebase** par chalti hai: **Hosting + Functions + Realtime Database**.

1. Firebase Console mein project **mizanoranet** select karein, Hosting/Functions/RTDB enable karein.
2. `FIREBASE_SERVICE_ACCOUNT_JSON` GitHub secret (or functions env) mein set karein.
3. `MZ_OWNER_PIN`, `MZ_SESSION_SECRET`, `MZ_STREAM_SECRET` configure karein.
4. `public/assets/js/api-base.js` mein `DEFAULT_BASE` khali rakhein (same-origin Firebase).
5. Deploy: `npm run deploy:firebase` ya main push par GitHub Actions workflow.

> Note: Cloud Functions deploy ke liye GCP billing/APIs enable honi chahiye. Agar billing abhi enable nahi, to `MZ_NO_FUNCTIONS=1` repo variable se hosting+database deploy ho sakti hai, lekin API/functions tab tak live nahi hongi jab tak billing/APIs enable na hon.

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
  Firebase serverless jaisa hi behavior.

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

Rewrite table **generated** hoti hai `routing.json` se (`npm run build:functions`)
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
- [ ] Firebase Hosting/Functions deploy green hai aur `/api/embed?action=health` OK hai

## 9. Troubleshooting

| Problem | Solution |
|---|---|
| **`Cloud Functions deployment requires the Cloud Build API to be enabled`** | Project owner ye links open karke APIs enable karein: [Cloud Build](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=mizanoranet) · [Cloud Functions](https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=mizanoranet) · [Artifact Registry](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=mizanoranet) · [Cloud Run](https://console.cloud.google.com/apis/library/run.googleapis.com?project=mizanoranet). Phir GitHub Actions → failed run → **Re-run failed jobs**. (Ya service account ko `Service Usage Admin` role dein — CI khud enable kar lega.) |
| **`This API requires a billing account` / billing prompt** | Cloud Functions deploy ke liye billing/APIs enable karein. Temporary workaround: `MZ_NO_FUNCTIONS=1` set karein (sirf hosting+database deploy hogi). |
| `deploy` job auth error | `FIREBASE_SERVICE_ACCOUNT` secret valid JSON hai? Re-generate key agar expire ho. |
| API 500 on `/api/*` | Functions logs dekhein: `npx firebase-tools@13 functions:log`. Env vars (`functions/.env`) missing honge. |
| `Firebase save failed` | Service account ko Realtime Database access do (IAM: `Firebase Realtime Database Admin`) ya rules publish karein. |
| Preview channel 404 on API | Pehli dafa `npm run deploy:firebase` se `app` function deploy karein — phir preview channels use karte hain. |
| Hosting 404 on `/admin` | `cleanUrls: true` + rewrites `firebase.json` mein hain — deploy `firebase.json` ke saath hi hua? |
| Functions fail but website live hai | Workflow pehle `hosting,database` deploy karta hai, phir `functions` — site publish ho jati hai, API routes functions deploy hote hi on ho jate hain. |

---

**Mizanora Projects** · Founder: Muaaz Iqbal · Kasur, Punjab, Pakistan · WhatsApp 0306-2015326

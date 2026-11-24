/**
 * Mizanora IPTV — Firebase Functions entry (single `app` HTTPS function).
 *
 * Firebase Hosting serves `public/` statically and rewrites the dynamic
 * routes (/api/*, Xtream player_api/get/xmltv, /live|movie|series, signed
 * /s/*, MAG /portal.php /stalker_portal /c/* and HLS /playout) to this
 * function, which dispatches to the exact same api/* handlers used on
 * Netlify, Firebase and in local development.
 *
 * `api/` and `rewrites.json` are copied here by scripts/build-functions.mjs
 * (from api/ + routing.json) during `npm run build:functions` / predeploy.
 */
import { onRequest } from "firebase-functions/v2/https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Rewrite table generated from routing.json — the single source of truth. */
const REWRITES = JSON.parse(fs.readFileSync(path.join(HERE, "rewrites.json"), "utf8")).map((r) => ({
  src: new RegExp("^" + r.source.replace(/\(\.\*\)/g, "(.*)").replace(/:([a-zA-Z]+)/g, "([^/]+)") + "$"),
  dest: r.destination
}));

function matchRewrite(pathname) {
  for (const r of REWRITES) {
    const m = pathname.match(r.src);
    if (m) {
      let dest = r.dest;
      m.slice(1).forEach((g, i) => { dest = dest.replace(new RegExp("\\$" + (i + 1), "g"), g); });
      const u = new URL(dest, "http://x");
      return { pathname: u.pathname, search: u.search };
    }
  }
  return null;
}

const handlerCache = new Map();
async function loadApiHandler(apiPathname) {
  const rel = apiPathname.replace(/^\/api\/?/, "");
  // Never expose internal helper modules over HTTP.
  if (rel.includes("..") || rel.startsWith("_") || rel.includes("/_")) return null;
  const file = path.normalize(path.join(HERE, "api", rel.endsWith(".js") ? rel : rel + ".js"));
  if (!file.startsWith(path.join(HERE, "api"))) return null;
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    if (!handlerCache.has(file)) {
      const mod = await import(pathToFileURL(file).href);
      handlerCache.set(file, mod.default);
    }
    return handlerCache.get(file);
  }
  return null;
}

export const app = onRequest(
  { region: "us-central1", memory: "512MiB", timeoutSeconds: 60, maxInstances: 40, concurrency: 80 },
  async (req, res) => {
    try {
      const incoming = new URL(req.url, "http://localhost");
      let pathname = decodeURIComponent(incoming.pathname);
      if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);

      const rw = matchRewrite(pathname);
      const effectivePath = rw ? rw.pathname : pathname;
      const merged = new URLSearchParams(incoming.search);
      if (rw) for (const [k, v] of new URLSearchParams(rw.search).entries()) merged.set(k, v);
      const effectiveSearch = merged.toString() ? "?" + merged.toString() : "";

      if (effectivePath.startsWith("/api/")) {
        const fn = await loadApiHandler(effectivePath);
        if (fn) {
          req.url = effectivePath + effectiveSearch;
          Object.defineProperty(req, "query", {
            value: Object.fromEntries(new URLSearchParams(effectiveSearch).entries()),
            writable: true,
            configurable: true
          });
          await fn(req, res);
          return;
        }
      }

      // Rewrite targets that resolve to static media (MPEG-TS .ts aliases)
      // redirect to the real hosted file — players follow the 302 transparently.
      if (rw && effectivePath !== pathname) {
        res.writeHead(302, { Location: effectivePath + effectiveSearch, "Cache-Control": "no-cache" });
        res.end();
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: "Not found" }));
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      }
      res.end(JSON.stringify({ ok: false, error: err?.message || "Internal server error" }));
    }
  }
);

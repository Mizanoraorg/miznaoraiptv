/**
 * Mizanora Net TV — Netlify Function entry (single `app` router).
 *
 * netlify.toml proxies every dynamic route (/api/*, Xtream player_api/get/xmltv,
 * /live|movie|series, MAG portal/stalker/c, signed /s/*, HLS /playout/* and
 * media .ts aliases) to this function via `/.netlify/functions/app/:splat`.
 * The original request path + query are recovered from the event and dispatched
 * to the exact same shared api/* handlers used on Firebase and in local dev.
 * Routing truth lives in routing.json (shared with scripts/dev-server.mjs).
 */
import { createRequire } from "node:module";
import embed from "../../api/embed.js";
import panel from "../../api/panel.js";
import portal from "../../api/portal.js";
import stream from "../../api/stream.js";
import xtream from "../../api/xtream.js";

const require = createRequire(import.meta.url);
const REWRITES = (require("../../routing.json").rewrites || []).map((r) => ({
  src: new RegExp("^" + r.source.replace(/\(\.\*\)/g, "(.*)").replace(/:([a-zA-Z]+)/g, "([^/]+)") + "$"),
  dest: r.destination
}));

const HANDLERS = {
  "/api/embed": embed,
  "/api/panel": panel,
  "/api/portal": portal,
  "/api/stream": stream,
  "/api/xtream": xtream
};

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

/** Recover the ORIGINAL request path (the proxy prefix may appear in event.path). */
function originalPath(event) {
  const marker = "/.netlify/functions/app";
  if (event.rawUrl) {
    try {
      const p = new URL(event.rawUrl).pathname;
      if (!p.startsWith(marker)) return p;
    } catch { /* fall through */ }
  }
  let p = String(event.path || "/");
  if (p.startsWith(marker)) p = p.slice(marker.length) || "/";
  try { return decodeURIComponent(p); } catch { return p; }
}

function originalSearch(event) {
  if (event.rawUrl) {
    try { return new URL(event.rawUrl).search; } catch { /* fall through */ }
  }
  if (event.rawQuery) return "?" + String(event.rawQuery).replace(/^\?/, "");
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(event.queryStringParameters || {})) {
    if (value !== undefined && value !== null) params.append(key, value);
  }
  const s = params.toString();
  return s ? "?" + s : "";
}

/** Minimal Node http surface the shared handlers rely on. */
function buildReq(event, url) {
  const headers = {};
  for (const [key, value] of Object.entries(event.headers || {})) {
    headers[String(key).toLowerCase()] = value;
  }
  let body = event.body;
  if (body && event.isBase64Encoded) body = Buffer.from(body, "base64");
  const req = {
    method: event.httpMethod || "GET",
    url,
    headers,
    body: body || undefined,
    rawBody: body && Buffer.isBuffer(body) ? body : undefined,
    readableEnded: true,
    socket: { remoteAddress: String(headers["x-nf-client-connection-ip"] || headers["x-forwarded-for"] || "").split(",")[0].trim() || "netlify" },
    on() { return this; },
    destroy() {}
  };
  return req;
}

function buildRes(resolve) {
  const res = {
    headersSent: false,
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; return this; },
    writeHead(status, headers) {
      this.statusCode = status;
      this.headersSent = true;
      Object.assign(this.headers, Object.fromEntries(Object.entries(headers || {}).map(([k, v]) => [String(k).toLowerCase(), v])));
      return this;
    },
    end(chunk) {
      this.headersSent = true;
      let body = chunk === undefined || chunk === null ? "" : chunk;
      let isBase64Encoded = false;
      if (Buffer.isBuffer(body)) {
        isBase64Encoded = true;
        body = body.toString("base64");
      } else {
        body = String(body);
      }
      resolve({ statusCode: this.statusCode, headers: this.headers, body, isBase64Encoded });
      return this;
    }
  };
  return res;
}

export const handler = async (event) => {
  return new Promise(async (resolve) => {
    try {
      let pathname = originalPath(event);
      if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
      const rw = matchRewrite(pathname);
      const effectivePath = rw ? rw.pathname : pathname;
      const merged = new URLSearchParams(originalSearch(event));
      if (rw) for (const [k, v] of new URLSearchParams(rw.search).entries()) merged.set(k, v);
      const effectiveSearch = merged.toString() ? "?" + merged.toString() : "";
      const req = buildReq(event, effectivePath + effectiveSearch);
      const res = buildRes(resolve);

      // Rewrite targets that resolve to static media (MPEG-TS .ts aliases) redirect
      // to the real hosted file — players follow the 302 transparently.
      if (effectivePath.startsWith("/api/")) {
        const fn = HANDLERS[effectivePath];
        if (fn) {
          Object.defineProperty(req, "query", {
            value: Object.fromEntries(new URLSearchParams(effectiveSearch).entries()),
            writable: true,
            configurable: true
          });
          await fn(req, res);
          return;
        }
      }
      if (rw && effectivePath !== pathname) {
        res.writeHead(302, { Location: effectivePath + effectiveSearch, "Cache-Control": "no-cache" });
        res.end();
        return;
      }
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: "Not found" }));
    } catch (err) {
      resolve({
        statusCode: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({ ok: false, error: err?.message || "Internal server error" }),
        isBase64Encoded: false
      });
    }
  });
};

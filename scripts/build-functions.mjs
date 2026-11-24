/**
 * Build the Firebase Functions bundle.
 *
 * Copies the shared serverless handlers (api/) and the generated rewrite
 * table (from vercel.json — the single routing source of truth) into
 * functions/, which Firebase deploys as the `app` HTTPS function.
 *
 * Run automatically by `firebase deploy` (functions predeploy) and by
 * `npm run build:functions`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FN_DIR = path.join(ROOT, "functions");

if (!fs.existsSync(path.join(FN_DIR, "index.js"))) {
  console.error("❌ functions/index.js missing — cannot build the Firebase bundle.");
  process.exit(1);
}

// Fresh copy of the shared API handlers + the data catalogs they import.
const apiTarget = path.join(FN_DIR, "api");
fs.rmSync(apiTarget, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "api"), apiTarget, { recursive: true });
const dataTarget = path.join(FN_DIR, "data");
fs.rmSync(dataTarget, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "data"), dataTarget, { recursive: true });

// Generated rewrite table (vercel.json is the single source of truth).
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
const rewrites = (vercel.rewrites || []).map(({ source, destination }) => ({ source, destination }));
fs.writeFileSync(path.join(FN_DIR, "rewrites.json"), JSON.stringify(rewrites, null, 2) + "\n");

const files = fs.readdirSync(apiTarget).length;
const dataFiles = fs.readdirSync(dataTarget).length;
console.log(`✅ functions bundle ready — api/ (${files} entries) + data/ (${dataFiles} entries) + rewrites.json (${rewrites.length} routes)`);

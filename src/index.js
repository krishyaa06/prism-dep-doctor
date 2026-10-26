"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { builtinModules } = require("node:module");
const { walk } = require("./walk");

const BUILTIN = new Set(builtinModules.flatMap((m) => [m, m.split("/")[0]]));
const SRC = /\.(m?[jt]sx?|cjs|cts|mts|vue|svelte|astro)$/;
const DEVLIKE = /^(@types\/|eslint|prettier|typescript$|vitest$|jest$|mocha$|nodemon$|ts-node$|tsx$|@vitejs\/|vite$|webpack|rollup|husky$|lint-staged$|@testing-library\/|tailwindcss$|postcss$|autoprefixer$|@biomejs\/|playwright$|@playwright\/|cypress$|concurrently$)/;
// packages that are used without being imported (CLIs, plugins, peer tooling)
const IMPLICIT = /^(@types\/|typescript$|eslint-(config|plugin)-|@typescript-eslint\/|prettier-plugin-|postcss$|autoprefixer$|tailwindcss$|@tailwindcss\/|husky$|lint-staged$|nodemon$|concurrently$|cross-env$|rimraf$|npm-run-all|ts-node$|tsx$)/;

/** Extract bare package names from JS/TS source. */
function importsOf(code) {
  const out = new Set();
  const res = [/\bimport\s+(?:type\s+)?(?:[\w*{}\s,$]+\s+from\s+)?["']([^"']+)["']/g, /\bexport\s+(?:type\s+)?[\w*{}\s,$]*\s+from\s+["']([^"']+)["']/g, /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g, /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, /\brequire\.resolve\s*\(\s*["']([^"']+)["']/g];
  const clean = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  for (const re of res) for (const m of clean.matchAll(re)) { const n = pkgName(m[1]); if (n) out.add(n); }
  return out;
}
function pkgName(spec) {
  if (!spec || /^[./#~]|^[a-z]+:(?!\/)/i.test(spec) && !spec.startsWith("node:") ) { if (!spec.startsWith("node:")) return null; }
  if (spec.startsWith("node:")) return null;
  if (/^(\.|\/|#|~\/|@\/|\$)/.test(spec) || /^(https?|data|virtual|bun):/.test(spec)) return null;
  const parts = spec.split("/");
  const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
  if (BUILTIN.has(name)) return null;
  return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i.test(name) ? name : null;
}
function analyze(root, { ignore = [] } = {}) {
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) throw new Error(`No package.json in ${root}`);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const deps = pkg.dependencies || {}, dev = pkg.devDependencies || {}, peer = pkg.peerDependencies || {}, opt = pkg.optionalDependencies || {};
  const declared = new Set([...Object.keys(deps), ...Object.keys(dev), ...Object.keys(peer), ...Object.keys(opt)]);
  const used = new Map(); // name -> [files]
  let configText = JSON.stringify(pkg.scripts || {}) + JSON.stringify(pkg.eslintConfig || {}) + JSON.stringify(pkg.prettier || "") + JSON.stringify(pkg.babel || {}) + JSON.stringify(pkg.jest || {});
  let files = 0;
  const nested = new Set();
  const all = walk(root);
  for (const rel of all) if (rel !== "package.json" && path.basename(rel) === "package.json") nested.add(path.dirname(rel) + "/");
  for (const rel of all) {
    if ([...nested].some((d) => rel.startsWith(d))) continue;
    const base = path.basename(rel);
    const isConfig = /(^|\.)(config|rc)\.(m?[jt]s|cjs|json|ya?ml)$|^\.[\w-]+rc(\.json)?$|^tsconfig.*\.json$/.test(base);
    if (!SRC.test(rel) && !isConfig) continue;
    const txt = fs.readFileSync(path.join(root, rel), "utf8");
    if (isConfig) configText += "\n" + txt;
    if (!SRC.test(rel)) continue;
    files++;
    for (const n of importsOf(txt)) { if (!used.has(n)) used.set(n, []); used.get(n).push(rel); }
  }
  const binNames = (name) => { try { const p = JSON.parse(fs.readFileSync(path.join(root, "node_modules", name, "package.json"), "utf8")); return typeof p.bin === "string" ? [name.split("/").pop()] : Object.keys(p.bin || {}); } catch { return [name.split("/").pop()]; } };
  const mentioned = (name) => { const short = name.replace(/^@[^/]+\//, ""); return configText.includes(name) || binNames(name).some((b) => new RegExp(`(^|[\\s"'&|;(])${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\s"'&|;)]|$)`).test(configText)) || (short.length > 3 && configText.includes(short)); };
  const isUsed = (n) => used.has(n) || mentioned(n) || (n.startsWith("@types/") && (used.has(n.slice(7).replace("__", "/").replace(/^([^@])/, "$1")) || declared.has(n.slice(7)) || n === "@types/node"));
  const issues = [];
  const ign = (n) => ignore.some((g) => g === n || (g.endsWith("*") && n.startsWith(g.slice(0, -1))));
  for (const n of Object.keys(deps)) if (!ign(n) && !isUsed(n) && !IMPLICIT.test(n)) issues.push({ level: "warn", code: "unused", name: n, msg: "Declared in dependencies but never imported" });
  for (const n of Object.keys(dev)) if (!ign(n) && !isUsed(n) && !IMPLICIT.test(n)) issues.push({ level: "info", code: "unused-dev", name: n, msg: "devDependency not referenced in code, scripts or configs" });
  for (const [n, where] of used) if (!declared.has(n) && !ign(n) && n !== pkg.name) issues.push({ level: "error", code: "missing", name: n, msg: `Imported but not in package.json`, where: where.slice(0, 3), more: where.length - 3 });
  for (const n of Object.keys(deps)) if (n in dev) issues.push({ level: "warn", code: "duplicate", name: n, msg: "Listed in both dependencies and devDependencies" });
  for (const n of Object.keys(deps)) if (DEVLIKE.test(n) && !(used.get(n) || []).some((f) => !/(^|\/)(test|tests|__tests__|e2e)\/|\.(test|spec)\.|config\./.test(f))) issues.push({ level: "warn", code: "misplaced", name: n, msg: "Looks like a build/dev tool — move to devDependencies" });
  for (const [n, v] of Object.entries({ ...deps, ...dev })) {
    if (/^(\*|latest|x|)$/.test(String(v).trim())) issues.push({ level: "error", code: "unpinned", name: n, msg: `Unpinned version "${v}" — builds are not reproducible` });
    else if (/^(git\+|git:|github:|https?:)|\.git(#|$)/.test(v)) issues.push({ level: "info", code: "git", name: n, msg: `Installed from git/url (${v})` });
    else if (/^(file:|link:|\.\.?\/)/.test(v)) issues.push({ level: "info", code: "local", name: n, msg: `Local path dependency (${v})` });
  }
  const hasLock = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "bun.lock"].filter((f) => fs.existsSync(path.join(root, f)));
  if (!hasLock.length && declared.size) issues.push({ level: "warn", code: "no-lockfile", name: "lockfile", msg: "No lockfile — commit package-lock.json / pnpm-lock.yaml" });
  if (hasLock.length > 1) issues.push({ level: "warn", code: "multi-lockfile", name: "lockfile", msg: `Multiple lockfiles: ${hasLock.join(", ")} — pick one package manager` });
  if (!pkg.engines?.node && declared.size) issues.push({ level: "info", code: "engines", name: "engines", msg: 'No "engines.node" — set the Node version you support' });
  return { pkg: { name: pkg.name, version: pkg.version }, counts: { dependencies: Object.keys(deps).length, devDependencies: Object.keys(dev).length, files, imported: used.size }, issues };
}
/** Fix: remove unused deps + move misplaced to devDependencies (keeps key order). */
function fix(root, issues, { dry = false } = {}) {
  const p = path.join(root, "package.json"), raw = fs.readFileSync(p, "utf8"), pkg = JSON.parse(raw);
  const indent = /^(\s+)"/m.exec(raw)?.[1] || "  ";
  const changes = [];
  for (const i of issues) {
    if (i.code === "unused" && pkg.dependencies?.[i.name]) { delete pkg.dependencies[i.name]; changes.push(`- removed ${i.name}`); }
    if ((i.code === "misplaced") && pkg.dependencies?.[i.name]) { (pkg.devDependencies ??= {})[i.name] = pkg.dependencies[i.name]; delete pkg.dependencies[i.name]; changes.push(`→ moved ${i.name} to devDependencies`); }
    if (i.code === "duplicate" && pkg.devDependencies?.[i.name]) { delete pkg.devDependencies[i.name]; changes.push(`- removed duplicate ${i.name} from devDependencies`); }
  }
  if (pkg.devDependencies) pkg.devDependencies = Object.fromEntries(Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b)));
  if (!dry && changes.length) fs.writeFileSync(p, JSON.stringify(pkg, null, indent) + (raw.endsWith("\n") ? "\n" : ""));
  return changes;
}
async function outdated(deps, fetchImpl = globalThis.fetch) {
  const out = [];
  await Promise.all(Object.entries(deps).map(async ([n, range]) => {
    try { const r = await fetchImpl(`https://registry.npmjs.org/${n.replace("/", "%2f")}/latest`); if (!r.ok) return; const { version } = await r.json(); const cur = String(range).replace(/^[\^~>=<\s]+/, ""); if (/^\d/.test(cur) && cur !== version) out.push({ name: n, current: range, latest: version, major: cur.split(".")[0] !== version.split(".")[0] }); } catch {}
  }));
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
module.exports = { importsOf, pkgName, analyze, fix, outdated };

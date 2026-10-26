#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("node:util");
const { analyze, fix, outdated } = require("../src");
const { c, header, plural, table } = require("../src/ui");
const pkg = require("../package.json");

const HELP = `${header("depdoc", "a check-up for package.json")}

${c.bold("Usage")}
  depdoc [dir] [options]

${c.bold("Checks")}
  ${c.red("missing")}     imported in code but not in package.json
  ${c.yellow("unused")}      in dependencies but never imported
  ${c.yellow("misplaced")}   build tools (eslint, vite, @types…) in dependencies
  ${c.yellow("duplicate")}   in both dependencies and devDependencies
  ${c.red("unpinned")}    "*" / "latest" versions      ${c.dim("+ lockfile, engines, git deps")}

${c.bold("Options")}
      --fix              remove unused, move misplaced (writes package.json)
      --outdated         also check npm for newer versions (network)
      --ignore <list>    packages to skip, e.g. react-dom,@scope/*
      --strict           warnings fail too (exit 1)
      --json             machine-readable output
  -v, --version / -h, --help`;

let a;
try { a = parseArgs({ allowPositionals: true, options: { fix: { type: "boolean" }, outdated: { type: "boolean" }, ignore: { type: "string" }, strict: { type: "boolean" }, json: { type: "boolean" }, version: { type: "boolean", short: "v" }, help: { type: "boolean", short: "h" } } }); }
catch (e) { console.error(c.red(`✖ ${e.message}`)); process.exit(2); }
const o = a.values;
if (o.help) { console.log(HELP); process.exit(0); }
if (o.version) { console.log(pkg.version); process.exit(0); }
const root = path.resolve(a.positionals[0] || ".");

(async () => {
  let r;
  try { r = analyze(root, { ignore: (o.ignore || "").split(",").map((s) => s.trim()).filter(Boolean) }); }
  catch (e) { console.error(c.red(`✖ ${e.message}`)); process.exit(2); }
  let old = [];
  if (o.outdated) { const p = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")); old = await outdated({ ...p.dependencies, ...p.devDependencies }); }
  const fail = r.issues.filter((i) => i.level === "error" || (o.strict && i.level === "warn"));
  if (o.json) { console.log(JSON.stringify({ ...r, outdated: old }, null, 2)); process.exit(fail.length ? 1 : 0); }

  console.log(header("depdoc", `${r.pkg.name || path.basename(root)}${r.pkg.version ? "@" + r.pkg.version : ""}`));
  console.log(c.dim(`${plural(r.counts.dependencies, "dependency", "dependencies")} · ${plural(r.counts.devDependencies, "devDependency", "devDependencies")} · ${plural(r.counts.files, "source file")} · ${r.counts.imported} packages imported`));
  const ICON = { error: c.red("✖"), warn: c.yellow("⚠"), info: c.cyan("i") };
  const COL = { error: c.red, warn: c.yellow, info: c.cyan };
  const order = { error: 0, warn: 1, info: 2 };
  if (!r.issues.length) console.log(`\n${c.green("✔")} Healthy. No dependency problems found.`);
  else {
    console.log();
    for (const i of r.issues.sort((x, y) => order[x.level] - order[y.level] || x.code.localeCompare(y.code))) {
      console.log(`  ${ICON[i.level]} ${COL[i.level](i.code.padEnd(12))} ${c.bold(i.name.padEnd(14))} ${c.dim(i.msg)}`);
      if (i.where) console.log(`    ${c.gray("               ↳ " + i.where.join(", ") + (i.more > 0 ? ` +${i.more}` : ""))}`);
    }
  }
  if (old.length) {
    console.log(`\n${c.bold("Outdated")}\n` + table(old.map((x) => [c.bold(x.name), c.dim(x.current), x.major ? c.red(x.latest) : c.green(x.latest), x.major ? c.red("major") : ""]), { head: ["PACKAGE", "WANTED", "LATEST", ""] }));
  }
  if (o.fix) {
    const ch = fix(root, r.issues);
    console.log(ch.length ? `\n${c.green("✔")} Fixed package.json:\n${ch.map((x) => "  " + x).join("\n")}\n${c.dim("  run your package manager's install to update the lockfile")}` : `\n${c.dim("Nothing auto-fixable.")}`);
  } else if (r.issues.some((i) => ["unused", "misplaced", "duplicate"].includes(i.code))) console.log(`\n${c.dim("Run")} ${c.cyan("depdoc --fix")} ${c.dim("to clean up unused / misplaced packages.")}`);
  const n = (l) => r.issues.filter((i) => i.level === l).length;
  console.log(`\n${n("error") ? c.red(plural(n("error"), "error")) : c.green("0 errors")} · ${c.yellow(plural(n("warn"), "warning"))} · ${c.cyan(plural(n("info"), "note"))}`);
  process.exit(fail.length ? 1 : 0);
})();

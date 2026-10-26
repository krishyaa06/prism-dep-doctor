const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { importsOf, pkgName, analyze, fix, outdated } = require("../src");
const demo = path.join(__dirname, "../examples/demo-app");
const bin = path.join(__dirname, "../bin/depdoc.js");

test("pkgName", () => {
  assert.equal(pkgName("react-dom/client"), "react-dom"); assert.equal(pkgName("@scope/pkg/sub"), "@scope/pkg");
  assert.equal(pkgName("./x"), null); assert.equal(pkgName("node:fs"), null); assert.equal(pkgName("fs"), null); assert.equal(pkgName("@/components"), null);
});
test("importsOf", () => {
  const s = [...importsOf(`import a from "a"; import {b} from 'b/x'; import "c"; const d = require("d"); await import("e"); export * from "f"; import type { G } from "g";\n// import z from "zz"\n/* require("yy") */`)].sort();
  assert.deepEqual(s, ["a", "b", "c", "d", "e", "f", "g"]);
});
test("analyze demo", () => {
  const r = analyze(demo);
  const by = (code) => r.issues.filter((i) => i.code === code).map((i) => i.name).sort();
  assert.deepEqual(by("missing"), ["date-fns", "zod"]);
  assert.deepEqual(by("unused"), ["lodash", "moment"]);
  assert.deepEqual(by("duplicate"), ["axios"]);
  assert.deepEqual(by("misplaced"), ["@types/react", "eslint"]);
  assert.deepEqual(by("unpinned"), ["moment"]);
  assert.deepEqual(by("unused-dev"), ["left-pad"]);
  assert.ok(by("no-lockfile").length);
});
test("fix rewrites package.json", () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "depdoc-"));
  fs.cpSync(demo, d, { recursive: true });
  const ch = fix(d, analyze(d).issues);
  const p = JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8"));
  assert.ok(ch.length >= 4); assert.ok(!p.dependencies.lodash); assert.ok(!p.dependencies.eslint); assert.ok(p.devDependencies.eslint); assert.ok(!p.devDependencies.axios);
});
test("outdated with mocked registry", async () => {
  const f = async (u) => ({ ok: true, json: async () => ({ version: u.includes("react") ? "19.0.0" : "1.0.0" }) });
  const r = await outdated({ react: "^18.2.0", tiny: "^1.0.0" }, f);
  assert.deepEqual(r, [{ name: "react", current: "^18.2.0", latest: "19.0.0", major: true }]);
});
test("cli", () => {
  assert.equal(spawnSync("node", [bin, demo]).status, 1);
  assert.equal(spawnSync("node", [bin, "/nope"]).status, 2);
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "depdoc-ok-"));
  fs.writeFileSync(path.join(d, "package.json"), JSON.stringify({ name: "ok", engines: { node: ">=18" }, dependencies: { kleur: "^4.0.0" } }));
  fs.writeFileSync(path.join(d, "package-lock.json"), "{}"); fs.writeFileSync(path.join(d, "i.js"), "require('kleur'); require('node:fs')");
  fs.mkdirSync(path.join(d, "sub")); fs.writeFileSync(path.join(d, "sub/package.json"), "{}"); fs.writeFileSync(path.join(d, "sub/x.js"), "require('zzz')");
  const r = spawnSync("node", [bin, d], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout); assert.match(r.stdout, /Healthy/);
});

<!-- ═════════════ HEADER ═════════════ -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:07060f,50:3DDC97,100:6C63FF&height=200&section=header&text=Prism%20Dep%20Doctor&fontSize=48&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=Find%20missing%20%26%20unused%20npm%20deps&descAlignY=58&descSize=16" width="100%" alt="Prism Dep Doctor" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=19&duration=2600&pause=800&color=3DDC97&center=true&vCenter=true&width=680&lines=depdoc;%E2%9C%96+missing++zod;%E2%9A%A0+unused++lodash;depdoc+--fix" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://github.com/krishyaa06/prism-dep-doctor/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/krishyaa06/prism-dep-doctor/ci.yml?branch=main&style=for-the-badge&label=CI&logo=githubactions&logoColor=white" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A518.17-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/dependencies-0-3DDC97?style=for-the-badge" alt="Zero dependencies" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/krishyaa06/prism-dep-doctor?style=for-the-badge&color=6C63FF" alt="License" /></a>
</p>

<p align="center">
  <img src="assets/screenshots/demo.png" width="90%" alt="Prism Dep Doctor screenshot" />
</p>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png" width="100%" alt="" />

## ⚡ Overview

**Prism Dep Doctor** (`depdoc`) reads every `import`, `require()` and dynamic `import()` in your JS / TS / Vue / Svelte code and compares it with `package.json`. It catches the classic AI-coding mistake — code that imports `zod` or `date-fns` which was never installed — plus dependencies nobody uses anymore, build tools sitting in `dependencies`, packages listed twice, and `*` / `latest` versions. `depdoc --fix` cleans `package.json` for you.

## ✨ Features

- **missing**: imported in code but not declared (with file locations)
- **unused**: declared but never imported — knows about CLI tools in `scripts` and plugins in config files
- **misplaced**: `eslint`, `vite`, `@types/*`, test runners in `dependencies`
- **duplicate** and **unpinned** (`*`, `latest`) versions, git / local deps, lockfile + `engines` checks
- `--fix` removes unused and moves misplaced packages, preserving your formatting
- `--outdated` checks the npm registry; `--json`, `--strict`, `--ignore`. Monorepo-aware (skips nested packages)

## 🚀 Quick Start

```bash
# run without installing
npx github:krishyaa06/prism-dep-doctor 

# or install globally
npm install -g github:krishyaa06/prism-dep-doctor
depdoc --fix
```

Requires Node.js 18.17+. No dependencies.

## 🛠️ Usage

```text
depdoc [dir] [options]

    --fix              remove unused, move misplaced (writes package.json)
    --outdated         also check npm for newer versions (network)
    --ignore <list>    packages to skip, e.g. react-dom,@scope/*
    --strict           warnings fail too (exit 1)
    --json             machine-readable output
```

### Checks

| Level | Check | Meaning |
|---|---|---|
| error | `missing` | imported in code but not in package.json |
| error | `unpinned` | `*` / `latest` / empty version |
| warn | `unused` | in dependencies, never imported or referenced |
| warn | `misplaced` | build / dev tool in dependencies |
| warn | `duplicate` | in both dependencies and devDependencies |
| warn | `no-lockfile` / `multi-lockfile` | lockfile hygiene |
| info | `unused-dev`, `git`, `local`, `engines` | worth a look |

### In CI

```yaml
- run: npx --yes github:krishyaa06/prism-dep-doctor
```

## 📁 Project Structure

```text
prism-dep-doctor/
├── assets/
│   ├── logo.png
│   └── logo.svg
├── bin/
│   └── depdoc.js   # CLI entry
├── examples/
│   └── demo-app/   # project with every problem
│       ├── src/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── test/
│       │   └── app.test.ts
│       └── package.json
├── src/
│   ├── index.js   # import parser, analyzer, fixer
│   ├── ui.js   # colours, tables
│   └── walk.js   # gitignore-aware walker
├── test/
│   └── depdoc.test.js
├── .gitignore
├── LICENSE
├── README.md
└── package.json
```

## 🧪 Tests

```bash
npm test
```

Tests use the built-in `node:test` runner, so there is nothing to install. CI runs them on Node 20 and 22.

## 🤝 Contributing

1. Fork the repo and create a branch: `git checkout -b feature/my-idea`
2. Make your change and add a test in `test/`
3. Run `npm test` and open a Pull Request

## 🔷 Part of Prism Protocol

Prism Dep Doctor is one of the open-source tools built by [Prism Protocol](https://dc.gg/prismprotocol), a tech community where young builders learn, ship and compete together.

## 👤 Author

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/krishyaa06"><img src="https://github.com/krishyaa06.png" width="90" style="border-radius:50%" alt="Soumya Bhandare" /><br><b>Soumya Bhandare</b></a><br>
      <sub>Founder @ Prism Protocol</sub>
    </td>
    <td>
      <a href="https://dc.gg/prismprotocol"><img src="https://img.shields.io/badge/Discord-Prism%20Protocol-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /></a><br>
      <a href="https://instagram.com/prism_protocol_"><img src="https://img.shields.io/badge/Instagram-@prism__protocol__-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" /></a><br>
      <a href="https://x.com/krishyaa06"><img src="https://img.shields.io/badge/X-@krishyaa06-000000?style=for-the-badge&logo=x&logoColor=white" alt="X" /></a>
    </td>
  </tr>
</table>

## 📄 License

Released under the [MIT License](LICENSE).

<p align="center">
  <b>If you like this project, consider giving it a ⭐</b><br>
  <sub>"Build. Create. Compete." · Made with ⚡ by Prism Protocol</sub>
</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6C63FF,50:3DDC97,100:07060f&height=110&section=footer" width="100%" alt="" />

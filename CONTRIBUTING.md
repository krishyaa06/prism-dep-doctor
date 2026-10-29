# Contributing to prism-dep-doctor

Thanks for taking the time to contribute! prism-dep-doctor is a command-line tool by [Prism Protocol](https://github.com/krishyaa06) — Zero-dependency CLI that finds missing, unused, misplaced, duplicate and unpinned npm dependencies by reading your actual imports — and fixes package.json for you.

## Getting started

```bash
git clone https://github.com/krishyaa06/prism-dep-doctor.git
cd prism-dep-doctor
```

## Before you open a pull request

Make sure everything passes locally:

```bash
npm test
```

## Guidelines

- **Zero dependencies.** Please don't add runtime dependencies — use Node.js built-ins (`node:fs`, `node:path`, `node:test`, …).
- Keep pull requests small and focused — one feature or fix per PR.
- Update the README when you change behaviour, flags or options.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add --json output
fix: handle empty input
docs: clarify install steps
```

Common types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`. Add a short entry under **[Unreleased]** in [CHANGELOG.md](CHANGELOG.md) for user-facing changes.

## Reporting bugs & ideas

Open an [issue](https://github.com/krishyaa06/prism-dep-doctor/issues) with:

- what you expected vs. what happened
- steps to reproduce
- your OS, browser or Node.js version

**Security issues:** please don't open a public issue — contact the maintainer privately via [GitHub](https://github.com/krishyaa06).

## License

By contributing, you agree that your contributions will be licensed under the project's [license](LICENSE).

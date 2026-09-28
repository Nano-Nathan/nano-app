# Contributing

Issues and pull requests are welcome on [Nano-Nathan/nano-app](https://github.com/Nano-Nathan/nano-app).

## Setup

Node.js 20 or newer, pnpm 10 (the version in the root `packageManager` field).

```bash
git clone https://github.com/Nano-Nathan/nano-app.git
cd nano-app
pnpm install
pnpm --filter @nano-app/backend test
pnpm --filter @nano-app/backend build
```

Set `DATABASE_URL` to a disposable PostgreSQL database to run the database suite. The suite can drop schemas. Do not point it at a database you need to keep.

## What to send

- Bug fixes in `backend/` and `core/`: a pull request here.
- A plugin: your own repository and npm package. See [PLUGINS.md](PLUGINS.md). Do not add `backend/plugins/<name>` unless a maintainer asked for that plugin in an issue.

Public API, comments, and these files are English: `README.md`, `PLUGINS.md`, `backend/README.md`.

## Pull requests

1. Branch from `main`.
2. Keep the change focused.
3. Run `pnpm --filter @nano-app/backend test`. If you touch the build, run `pnpm --filter @nano-app/backend build`.
4. Describe why the change exists. A linked issue helps.

## Releases

Every push to `main` runs the publish workflow. [semantic-release](https://github.com/semantic-release/semantic-release) reads the commits since the last `vX.Y.Z` tag and publishes `@nano-app/backend` only when one of them is a [Conventional Commit](https://www.conventionalcommits.org/) that asks for it:

| Commit | Release |
|---|---|
| `fix: …` | patch (`0.7.0` → `0.7.1`) |
| `feat: …` | minor (`0.7.0` → `0.8.0`) |
| `feat!: …` or a `BREAKING CHANGE:` footer | minor while the version is `0.x` |
| Any other message | none |

The version lives in the git tags and on npm. `backend/package.json` keeps a placeholder, and the release notes are the [GitHub Releases](https://github.com/Nano-Nathan/nano-app/releases). Do not publish from your machine.

## License

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE) of this repository.

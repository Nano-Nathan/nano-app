# Contributing

Issues and pull requests are welcome on [Nano-Nathan/nano-app](https://github.com/Nano-Nathan/nano-app).

## Setup

Node.js 22.23.4, 24.22.1 or 26.12.1 and newer, pnpm 12 (the version in the root `packageManager` field).

```bash
git clone https://github.com/Nano-Nathan/nano-app.git
cd nano-app
pnpm install
pnpm test
pnpm build
```

Set `DATABASE_URL` in a `.env` at the repository root, pointing at a disposable PostgreSQL database, to run the database suite. The test scripts of the backend and the plugins read it. The suite can drop schemas. Do not point it at a database you need to keep.

## What to send

- Bug fixes in `backend/`, `core/`, `plugins/`, `frontend/` and `components/`: a pull request here.
- A plugin: your own repository and npm package. See [`plugins/README.md`](plugins/README.md#write-a-plugin). Do not add `plugins/<name>` unless a maintainer asked for that plugin in an issue.

Public API, comments, and these files are English: `README.md` and the README of each package.

## Pull requests

`main` is protected: every change reaches it through a pull request.

1. Branch from `main`: `feat/<topic>`, `fix/<topic>`, `refactor/<topic>`, `docs/<topic>`.
2. Keep the change focused.
3. Run `pnpm test`. If you touch the build, run `pnpm build`. Both run every package; `pnpm --filter <package>` runs one.
4. Open the pull request to `main`. Its title must be a [Conventional Commit](https://www.conventionalcommits.org/) (`feat: add X`, `fix: Y`), without `!`: the merge squashes the branch into one commit whose message is the title and the description of the pull request, and that message decides the release (see [Releases](#releases)).
5. Describe why the change exists. A linked issue helps. A breaking change ends the description with a `BREAKING CHANGE: <what breaks>` line.

Each development (a feature, a fix, a refactor) is one branch and one pull request to `main`. Only a feature the maintainer decides to split, because it is too large for one review, is built in modules:

1. Branch the feature from `main` (`feat/<feature>`) and push it. Link an issue when there is one.
2. Branch each module from the up-to-date feature branch (`feat/<feature>--<module>`) and open its pull request to the feature branch. Start the next module after it is merged.
3. If `main` moves, merge `main` into the feature branch (no rebase: module branches start from it).
4. When the feature is done, open one pull request from the feature branch to `main`. Its title decides the release.

Each package's publish workflow runs its tests and build on every pull request that touches the package, to `main` or to a feature branch. Their jobs (`test-backend`, `test-plugins`, `test-frontend`, `test-components`) are the checks required to merge, with the `dependency-review` and `audit` jobs of `security.yml`, which fail on a dependency with a high or critical advisory. The PostgreSQL suite runs on a Neon branch created for the run; pull requests from forks and Dependabot skip it.

## Planning a development

How the framework behaves is the maintainer's decision, so a development is planned before it is written. The code follows [`.claude/CLAUDE.md`](https://github.com/Nano-Nathan/nano-app/blob/main/.claude/CLAUDE.md).

1. Before writing any code, list what it will do, point by point. Each point says what and how, in plain words: what comes in, what happens to it, what goes out, and what it reuses.
2. When a point hides a decision (a default, an edge case, an error, where the code lives), give two or three options with their cost and mark one as the recommendation.
3. The maintainer answers point by point. Adjust the points and list again only what changed.
4. Implement only when every point has the maintainer's OK. A change of behavior that shows up while implementing goes back to the maintainer before it is written.
5. The tests, the README of the package and the feature file in [`features/`](https://github.com/Nano-Nathan/nano-app/blob/main/features/README.md) follow the final decisions, not the first proposal.

A feature split into modules is planned and reviewed module by module. A large idea is first broken into tasks: see [Breaking down a feature](https://github.com/Nano-Nathan/nano-app/blob/main/features/README.md#breaking-down-a-feature).

## Rules of the repository

- pnpm only: `pnpm install`, `pnpm test`, `pnpm build`, `pnpm --filter <package> <script>`. Never npm or npx.
- Branches have a descriptive name of what they do, never ids or generated names. Work on the existing branch of the topic when there is one.
- A change that breaks the public API ends its pull request body with a `BREAKING CHANGE: <what breaks>` footer: the squash commit keeps the body.
- Agents commit and push their work to its branch and always open its pull request. They never add a `Co-authored-by` trailer to commits or pull requests: co-authorship is added by hand by the maintainer.
- Never commit secrets. To use the root `.env` elsewhere, copy the file.
- Install scripts run only for the packages in `allowBuilds` of `pnpm-workspace.yaml`.
- Workflows: `permissions: contents: read` by default; `id-token: write` and `contents: write` only on release jobs. Packages are published only by CI (npm trusted publishing).
- Report vulnerabilities as in [SECURITY.md](SECURITY.md).

## Releases

Each published package has its own version, its own tags and its own publish workflow, which runs on a merge to `main` that touches the package:

| Package | Touched paths | Tags | Workflow |
|---|---|---|---|
| `@nano-app/backend` | `backend/`, `core/` | `backend-vX.Y.Z` | `publish-backend.yml` |
| `@nano-app/plugins` | `plugins/` | `plugins-vX.Y.Z` | `publish-plugins.yml` |
| `@nano-app/frontend` | `frontend/`, `core/` | `frontend-vX.Y.Z` | `publish-frontend.yml` |
| `@nano-app/components` | `components/`, `core/` | `components-vX.Y.Z` | `publish-components.yml` |

[semantic-release](https://github.com/semantic-release/semantic-release) reads the commits since the package's last tag, with the `angular` preset of each `.releaserc.json`, and publishes it only when one of them asks for it. It reads every commit since that tag, also the ones that touched only another package:

| Commit | Release |
|---|---|
| `fix: …`, `fix(<scope>): …` | patch (`0.7.0` → `0.7.1`) |
| `feat: …`, `feat(<scope>): …` | minor (`0.7.0` → `0.8.0`) |
| A `BREAKING CHANGE:` line in the description | minor while the version is `0.x` |
| A `!` after the type (`feat!: …`) | none: the `angular` preset does not read it, so the whole commit is ignored |
| Any other message (`refactor:`, `docs:`, `chore:`…) | none |

A merge that touches only files outside the packages (the root `package.json`, `.github/`, the docs) runs no publish workflow: its commit is published with the next merge that touches the package.

The version lives in the git tags and on npm. Each `package.json` keeps a placeholder, and the release notes are the [GitHub Releases](https://github.com/Nano-Nathan/nano-app/releases). Do not publish from your machine.

## License

By contributing, you agree that your contribution is licensed under the [MIT License](https://github.com/Nano-Nathan/nano-app/blob/main/LICENSE) of this repository.

# nano-app

pnpm monorepo: `core/` (private, inlined into the backend), `backend/` (`@nano-app/backend`), `plugins/` (`@nano-app/plugins`), `frontend/` (`@nano-app/frontend`). Read the README of the package you touch before changing it.

## Workflow

- pnpm only: `pnpm install`, `pnpm test`, `pnpm build`, `pnpm --filter <package> <script>`. Never npm or npx.
- Tests: `node:test` run with tsx. `DATABASE_URL` comes from the root `.env` (a disposable Neon database; the suites drop schemas).
- Branches have a descriptive name of what they do (`feat/<topic>`, `fix/<topic>`, `refactor/<topic>`, `docs/<topic>`), never ids or generated names. Work on the existing branch of the topic when there is one.
- Every change reaches `main` through a pull request. Its title is a Conventional Commit: it decides the release of each touched package.
- A feature built in modules (see below) lives on a feature branch from `main` (`feat/<feature>`), linked to an issue when there is one. Each module gets its own branch from the up-to-date feature branch (`feat/<feature>--<module>`, `--` because a branch cannot also be a folder of branches) and a pull request to the feature branch. The next module starts only after that pull request is merged. When the feature is done, one pull request takes the feature branch to `main`, and its title decides the release.
- Planned features live in `features/`, one file per feature, with its scope, status and log. Read `features/README.md` before taking one.
- When `main` moves during a feature, merge `main` into the feature branch; never rebase it, module branches start from it.
- Agents do not commit or push. Stage only the files you changed; the maintainer commits.
- Agents never add a `Co-authored-by` trailer (for themselves or another agent) to commits or pull requests: co-authorship is added by hand by the maintainer.

## New development: plan per module, implement after approval

How the framework behaves (what it does with a request, a config, an error, a plugin, the database; what it accepts, rejects, stores or returns) is the maintainer's decision. Code style is not: follow this file without asking.

New work is split into modules that are reviewed one at a time (for stores: loading the files, creating the stores, reading and writing them, using them in React).

1. Before writing any code of a module, list what it will do, point by point. Each point says what and how, in plain words: what comes in, what happens to it, what goes out, and what it reuses from `core/` or existing code.
2. When a point hides a decision (a default, an edge case, an error, where the code lives), give two or three options with their cost and mark one as the recommendation.
3. The maintainer answers point by point. Adjust the points and list again only what changed.
4. Implement the module only when every point has the maintainer's OK. Then show the diff; the module's pull request goes to the feature branch, and the next module starts after it is merged.

Reuse and extend what exists (`core/` loaders, validators, utils) before writing new code, and keep each module to the smallest code that does the job.

## Principles

Industry practices this repository follows. The concrete rules below win when they are more specific.

- **A framework for others**: every feature is general, never shaped for one app or one plugin. The consumer gets a small, easy layer (`createRoute`, `createPlugin`, one config object) and the framework does the work behind it. Convention over configuration: a file in the right folder works without registering it.
- **Only what is needed**: add exactly what the task requires. No option, default, fallback, retry or `try`/`catch` nobody asked for; when something is missing, fail with a clear message instead of guessing. General does not mean speculative: generalize what exists, do not build for cases nobody has.
- **KISS and YAGNI**: the simplest solution for today's need. No code for a future that has not arrived.
- **DRY**: one source of truth for each piece of knowledge (a rule, a message, a constant), not only for repeated lines.
- **Single responsibility**: a function does one thing, a file has one job, a module one reason to change.
- **Separation of concerns**: I/O (files, network, database, `console`) at the edges; the logic in between receives values and returns values, so it can be tested and read alone.
- **Fail fast**: invalid configuration fails at startup with a clear message, not on the first request.
- **Validate at the boundaries**: data from outside (requests, consumer files, env) is checked once where it enters; inside, types are trusted.
- **Immutability**: `const` by default, `let` only when a value changes. Do not mutate parameters; return a new value.
- **Least surprise**: names say what a thing does and nothing more; a function named `get` has no side effects.
- **Least privilege**: routes private by default, workflow permissions minimal, no secrets in logs.
- **HTTP semantics**: `GET` reads and never changes state; status codes mean what the standard says (400 bad input, 401 not authenticated, 403 not allowed, 404 not found, 5xx server fault).
- **Semantic Versioning and Conventional Commits**: a change to the public API is `feat!:`; fixes are `fix:`.
- **Tests describe behavior**, not implementation: they call the public API and check what a consumer sees.
- **Boy Scout rule**: code you touch for a task follows this file when you leave it; code you do not touch stays as is.

## Code style

Match `core/` and `backend/src/`. The simplest code that works wins.

### Structure

- Small files with one job. A file over ~120 lines, or a function you cannot read in one screen, is a sign to split or simplify.
- Code that repeats is extracted the second time it appears (`Validator.warn`, `Formatter.error`); no abstraction for a single use. No option, parameter or config nobody asked for.
- Exported functions of `backend` and `plugins` stay even when nothing in the repo uses them: consumers may. `core` is private: what nothing uses there is deleted.
- Up to 3 positional parameters; with more, one object (`FindOptions`).
- A class when there is state (`Database`, `Plugin`); `abstract class` with `static` methods for stateless utilities grouped by area (`FileReader`, `Validator`). Public API is plain functions (`createRoute`, `createPlugin`).
- `public`, `protected` or `private` on every class method and field; constructors go without.
- Declared functions and methods state their return type (`: Promise<void>`); inline callbacks infer it.
- No `any` without a comment saying why (`// any: anything can be thrown`). Prefer `unknown` and validate.
- Types in a `types/` folder of the package, one file per area (`types/app.ts`, `types/plugin.ts`). `type`, not `interface`. `import type` for types.
- Files: PascalCase when they export a class (`FileLoader.ts`), lowercase otherwise (`creators.ts`, `config.ts`).
- `export default` when a file exports one thing, also the official plugins (`import health from '@nano-app/plugins/health'`). Named exports for files that export several.
- Imports in groups: Node built-ins with `node:` (`node:fs`), dependencies, `@nano-app/*`, relative files, then every `import type` in the same order. Optional dependencies are imported when needed (`await import('@prisma/adapter-pg')`), never at the top.

### Names

Prefix by type on every internal name: local variables, parameters, class fields, loop and callback variables, `catch`, and Express's `oReq`, `oRes`, `fnNext`. No prefix on: public API (exported types and their fields, plugin options, responses), names destructured from it (`const { name, routesDir } = oConfig`), declared functions and methods, module constants (`HTTP_METHODS`), type parameters (`T`, `DB`) and tool configs (`tsdown.config.ts`).

| Prefix | Type | Example |
|---|---|---|
| `o` | object, class instance, Map, Set, Date, Promise, RegExp, `unknown` | `oPlugins`, `oConfig`, `oEntry` |
| `a` | array | `aRoutes` |
| `fn` | function | `fnMethod` |
| `s` | string | `sPath` |
| `i` | number, integer or not | `iPort`, `iValue` |
| `is` | boolean | `isEnabled`, `isPlugin` |

A union with `null` or `undefined` takes the prefix of the other type (`sName?: string`). An unused parameter starts with `_` before its prefix (`_oRes`). A class kept in a variable stays PascalCase (`const PrismaClient = …`), as `new` expects. A callback parameter whose name is passed as is to a public field has no prefix (`.then(onBeforeResult => fnMethod(oReq, { ...oParams, onBeforeResult }))`).

```ts
private static oClients: NanoObject = {};

function mount(sName: string, oConfig: PluginConfig) {
  const { routesDir, basePath } = oConfig;
  const aRoutes = [];
  for (const oRoute of aRoutes) oRoute.mount();
}

const fnGuard: RequestHandler = (oReq, oRes, fnNext) => fnNext();
```

### Flow

- Guard clauses and early returns, not nested `if`/`else`.
- One ternary at most, never nested nor inside an `if` condition: give it a name first (`const isInvalid = isPlugin ? isPluginInvalid : isConsumerInvalid;`).
- `??` for defaults. `||` only when `0`, `''` or `NaN` must also take the default (`message || 'Internal server error'`).
- `for...of` to iterate when nothing is returned, never `.forEach` (it does not wait for `await`). `.map`, `.filter` and `.some` when they return something.
- `async`/`await` in general. Express handlers and middlewares chain `.then()` and end in `.catch(fnNext)`.
- Errors: invalid consumer files are warned about and skipped (one bad route does not discard the rest). Startup problems throw `new Error('[nano-app] [ERROR] …')`, no error classes. Handlers throw a string (400) or `{ status, message, warning }`.
- Messages: `[nano-app] [ERROR]`, `[nano-app] [WARNING]` or `[nano-app] [INFO]`, then the file or thing, what is wrong, and the command that fixes it (``Run `pnpm add prisma`.``).

### Comments and format

- `/** */` above declarations, `//` inside bodies, never `/* */`. A one-line JSDoc on everything exported, and a short comment before each step of a function, even an obvious one (`// Checks that the default export is an object`). English.
- One line when it reads easily (`if (!oUser) return fnNext({ status: 401 });`). Vertical when it does not: nested objects, calls with several arguments, destructuring.
- Prettier (`.prettierrc.json`): single quotes (backticks only to interpolate; never `+` to join strings, `.join('\n')` for lines), semicolons, 2 spaces, 100 columns, arrow functions without parentheses on one parameter (`oRoute => oRoute.path`). `pnpm format` writes, CI checks.

- No commented-out code, unless a `// TODO:` above it says when it comes back or goes away.

### Tests

- `node:test` against the real thing: an Express server started by the test and a real database. No mocks.
- Tests and fixtures follow the same style: prefixes and a comment per step.

## Security

- Never commit secrets, and never print them: no `cat .env`, no `source .env`, no logging `process.env`. The only exception is the master API key of `auth`, printed once when it is created: the database keeps only its hash. To use the root `.env` elsewhere, copy the file.
- Untrusted input (`req.body`, `req.params`, `req.query`, headers) is validated before use. SQL uses parameters (`$1`); identifiers (schema, table) come only from constants.
- Routes are private by default. A plugin that exposes something public says so in its README; with `auth`, only `publicPaths` and what is mounted before it are public.
- The error handler answers with the message of what was thrown, also on 5xx: it is the consumer's job not to throw internal data. Framework messages never include secrets or connection strings.
- No DDL at startup: the consumer migrates their schemas with Prisma; the startup only generates clients and checks tables. The one exception is an official plugin's reviewed, additive migrations (`migrations/` next to its schema), applied with `prisma migrate deploy` (see PLUGINS.md).
- A new dependency needs a reason a built-in cannot cover. No dependencies with install scripts.
- Workflows: `permissions: contents: read` by default; `id-token: write` and `contents: write` only on release jobs. Packages are published only by CI (npm trusted publishing).
- Report vulnerabilities as in [SECURITY.md](../SECURITY.md).

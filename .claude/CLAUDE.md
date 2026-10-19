# nano-app

pnpm monorepo: `core/` (private, inlined into the backend), `backend/` (`@nano-app/backend`), `plugins/` (`@nano-app/plugins`). Read the README of the package you touch before changing it.

## Workflow

- pnpm only: `pnpm install`, `pnpm test`, `pnpm build`, `pnpm --filter <package> <script>`. Never npm or npx.
- Tests: `node:test` run with tsx. `DATABASE_URL` comes from the root `.env` (a disposable Neon database; the suites drop schemas).
- Every change reaches `main` through a pull request. Its title is a Conventional Commit: it decides the release of each touched package.
- Agents do not commit or push. Stage only the files you changed; the maintainer commits.
- No Claude attribution in commits or pull requests.

## Code style

Match `core/` and `backend/src/`. The simplest code that works wins.

### Structure

- Small files with one job. A file over ~120 lines, or a function you cannot read in one screen, is a sign to split or simplify.
- No abstraction until there are two real uses. No option, parameter or config nobody asked for.
- A class when there is state (`Database`, `Plugin`); `abstract class` with `static` methods for stateless utilities grouped by area (`FileReader`, `Validator`). Public API is plain functions (`createRoute`, `createPlugin`).
- `public`, `protected` or `private` on every class method and field; constructors go without.
- Declared functions and methods state their return type (`: Promise<void>`); inline callbacks infer it.
- No `any` without a comment saying why (`// any: anything can be thrown`). Prefer `unknown` and validate.
- Types in a `types/` folder of the package, one file per area (`types/app.ts`, `types/plugin.ts`). `type`, not `interface`. `import type` for types.
- Files: PascalCase when they export a class (`FileLoader.ts`), lowercase otherwise (`creators.ts`, `config.ts`).
- `export default` when a file exports one thing, also the official plugins (`import health from '@nano-app/plugins/health'`). Named exports for files that export several.
- Node built-ins before a dependency. Optional dependencies are imported when needed (`await import('@prisma/adapter-pg')`), never at the top.

### Names

Prefix by type on every internal name: local variables, parameters, class fields, loop and callback variables, `catch`, and Express's `oReq`, `oRes`, `fnNext`. No prefix on: public API (exported types and their fields, plugin options, responses), names destructured from it (`const { name, routesDir } = oConfig`), declared functions and methods, module constants (`HTTP_METHODS`) and type parameters (`T`, `DB`).

| Prefix | Type | Example |
|---|---|---|
| `o` | object, class instance, Map, Set, Date, Promise, RegExp, `unknown` | `oPlugins`, `oConfig`, `oEntry` |
| `a` | array | `aRoutes` |
| `fn` | function | `fnMethod` |
| `s` | string | `sPath` |
| `i` | number, integer or not | `iPort`, `iValue` |
| `b` | boolean | `bEnabled` |

A union with `null` or `undefined` takes the prefix of the other type (`sName?: string`). A callback parameter whose name is passed as is to a public field has no prefix (`.then(onBeforeResult => fnMethod(oReq, { ...oParams, onBeforeResult }))`).

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
- `??` for defaults. `||` only when `0`, `''` or `NaN` must also take the default (`message || 'Internal server error'`).
- `for...of` to iterate when nothing is returned, never `.forEach` (it does not wait for `await`). `.map`, `.filter` and `.some` when they return something.
- `async`/`await` in general. Express handlers and middlewares chain `.then()` and end in `.catch(fnNext)`.
- Errors: invalid consumer files are warned about and skipped (one bad route does not discard the rest). Startup problems throw `new Error('[nano-app] [ERROR] …')`, no error classes. Handlers throw a string (400) or `{ status, message, warning }`.
- Messages: `[nano-app] [ERROR]`, `[nano-app] [WARNING]` or `[nano-app] [INFO]`, then the file or thing, what is wrong, and the command that fixes it (``Run `nano-app-auth migrate` first.``).

### Comments and format

- A one-line JSDoc on everything exported, and a short comment before each step of a function, even an obvious one (`// Checks that the default export is an object`). English.
- One line when it reads easily (`if (!oUser) return fnNext({ status: 401 });`). Vertical when it does not: nested objects, calls with several arguments, destructuring.
- Prettier (`.prettierrc.json`): single quotes (backticks only to interpolate), semicolons, 2 spaces, 100 columns, arrow functions without parentheses on one parameter (`oRoute => oRoute.path`). `pnpm format` writes, CI checks.

- No commented-out code, unless a `// TODO:` above it says when it comes back or goes away.

### Tests

- `node:test` against the real thing: an Express server started by the test and a real database. No mocks.
- Tests and fixtures follow the same style: prefixes and a comment per step.

## Security

- Never commit secrets, and never print them: no `cat .env`, no `source .env`, no logging `process.env`. To use the root `.env` elsewhere, copy the file.
- Untrusted input (`req.body`, `req.params`, `req.query`, headers) is validated before use. SQL uses parameters (`$1`); identifiers (schema, table) come only from constants.
- Routes are private by default. A plugin that exposes something public says so in its README; with `auth`, only `publicPaths` and what is mounted before it are public.
- The error handler answers with the message of what was thrown, also on 5xx: it is the consumer's job not to throw internal data. Framework messages never include secrets or connection strings.
- No DDL at startup: migrations are a manual command (`nano-app-auth migrate`, `nano-app push`). The startup may only check them.
- A new dependency needs a reason a built-in cannot cover. No dependencies with install scripts.
- Workflows: `permissions: contents: read` by default; `id-token: write` and `contents: write` only on release jobs. Packages are published only by CI (npm trusted publishing).
- Report vulnerabilities as in [SECURITY.md](../SECURITY.md).

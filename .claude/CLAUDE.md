# nano-app

pnpm monorepo: `core/` (private, inlined into the backend, frontend and components), `backend/` (`@nano-app/backend`), `plugins/` (`@nano-app/plugins`), `frontend/` (`@nano-app/frontend`), `components/` (`@nano-app/components`). Read the README of the package you touch before changing it.

This file holds the code guidelines. Branches, pull requests, releases and how a development is planned and approved are in [CONTRIBUTING.md](../CONTRIBUTING.md); planned features in [`features/`](../features/README.md).

Before writing or showing any code, read this file again; before pushing, check the whole diff against it.

## Clean core

- **A framework for others**: every feature is general, never shaped for one app or one plugin. The consumer gets a small, easy layer (`createRoute`, `createPlugin`, one config object) and the framework does the work behind it. Convention over configuration: a file in the right folder works without registering it.
- **The consumer owns the app**: the security and the rules of an app (what a body may bring, how many records a list answers) are the consumer's. The framework gives the place to set them and never decides them.
- **Least code**: add exactly what the task needs, with the least code possible. No option, default, fallback, retry or `try`/`catch` nobody asked for, and no code for a case nobody has. Prefer reusing what exists, and no change over a small one.
- **Reuse before writing**: before writing anything, check whether an installed dependency (zod, Drizzle, TanStack Query, Better Auth, Express, Next) or `core/` already gives it; when none does, whether a tool that already exists (a library, a CLI, a feature of the platform) solves the problem. A hand-made copy is more code to maintain and leaves the gaps the tool closed.
- **A new dependency** needs a reason a built-in or an installed one cannot cover.
- **A cleanup never changes behavior**: a refactor or a simplification leaves what the framework accepts, rejects, stores and answers as it was. A change of behavior, however small, goes to the plan as a decision before any code.
- **Behavior is the maintainer's decision**: what the framework does with a request, a config, an error, a plugin or the database. Code style is not: follow this file without asking.
- **`core/` is private**: what nothing uses there is deleted. Exported functions of `backend` and `plugins` stay even when nothing in the repo uses them: consumers may.
- **DRY**: one source of truth for each piece of knowledge (a rule, a message, a constant). Code that repeats is extracted the second time it appears (`Logger.warn`); no abstraction for a single use.
- **Single responsibility**: a function does one thing, a file has one job. A file over ~120 lines, or a function you cannot read in one screen, is a sign to split or simplify.
- **Fail fast**: invalid configuration fails at startup with a clear message, not on the first request. When something is missing, fail instead of guessing.
- **Validate at the boundaries**: data from outside (requests, consumer files, env) is checked once where it enters; inside, types are trusted.
- **Immutability**: `const` by default, `let` only when a value changes. Do not mutate parameters; return a new value.
- **Least surprise**: names say what a thing does and nothing more; a function named `get` has no side effects.
- **HTTP semantics**: `GET` reads and never changes state; status codes mean what the standard says (400 bad input, 401 not authenticated, 403 not allowed, 404 not found, 5xx server fault).
- **Tests describe behavior**, not implementation: they call the public API and check what a consumer sees.
- **Boy Scout rule**: code you touch for a task follows this file when you leave it; code you do not touch stays as is.

## Code style

Match `core/` and `backend/src/`. The simplest code that works wins.

### Structure

- Up to 3 positional parameters; with more, one object (`DatabaseConfig`).
- A class when there is state (`Database`, `Plugin`); `abstract class` with `static` methods for stateless utilities grouped by area (`FileReader`, `Validator`). Public API is plain functions (`createRoute`, `createPlugin`).
- The function of `createController` returns its object: `callbacks` first (`onMount` reads what the view needs), then the methods. Before the `return` only `const` that read the context or the options (`const oApi = stores[store];`, a path); no functions, hooks or effects. Logic lives in the methods: one reaches another with `this` (`last() { return this.items()[0]; }`, method syntax, never an arrow), also from `onMount`. The view renders; its only hook is a `useEffect` that calls a method when a value changes (`useEffect(guard, [backend.get('/session')]);`).
- The object of `createRoute` goes in order: its config (`expression`, `public`, `permissions`), then `callbacks`, then the handlers (`GET`, `POST`…).
- The function of `createPlugin` returns its config: its keys first (`name`, `basePath`, `stage`, `routesDir`, `options`), then `callbacks`. Before the `return` only `const` that read the options; no functions. Logic lives in the callbacks: what a callback needs is a `const` at its start (`const fnRefill = …`).
- `public`, `protected` or `private` on every class method and field; constructors go without.
- Declared functions and methods state their return type (`: Promise<void>`); inline callbacks infer it, and so does the factory of a component (`list`), from the controller it returns.
- No `any` without a comment saying why (`// any: anything can be thrown`). Prefer `unknown` and validate.
- Types are declared where values are born and inferred from there. Data from outside (JSON, env) gets a typed variable where it enters (`const oFiles: StoreFiles = JSON.parse(…)`).
- Types in a `types/` folder of the package, one file per area (`types/app.ts`, `types/plugin.ts`). `type`, not `interface`. `import type` for types.
- Generic objects are `NanoObject` (`core/types/objects.ts`), with the value type when it is known (`NanoObject<Store>`), never `object` or `Record<string, …>`.
- Files: PascalCase when they export a class (`FileLoader.ts`), lowercase otherwise (`creators.ts`, `config.ts`).
- `export default` when a file exports one thing, also the official plugins (`import health from '@nano-app/plugins/health'`). Named exports for files that export several.
- Imports in groups: Node built-ins with `node:` (`node:fs`), dependencies, `@nano-app/*`, relative files, then every `import type` in the same order. Optional dependencies are imported when needed (`await import('pg')`), never at the top.

### Names

Prefix by type on every internal name: local variables, parameters, class fields, loop and callback variables, `catch`, and Express's `oReq`, `oRes`, `fnNext`. No prefix on: public API (exported types and their fields, plugin options, responses), names destructured from it (`const { name, routesDir } = oConfig`), declared functions and methods, module constants (`PRIVATE_NETWORKS`), type parameters (`T`, `DB`) and tool configs (`tsdown.config.ts`).

| Prefix | Type | Example |
|---|---|---|
| `o` | object, class instance, Map, Set, Date, Promise, RegExp, `unknown` | `oPlugins`, `oConfig`, `oEntry` |
| `a` | array | `aRoutes` |
| `fn` | function | `fnMethod` |
| `s` | string | `sPath` |
| `i` | number, integer or not | `iPort`, `iValue` |
| `is` | boolean | `isEnabled`, `isPlugin` |

A union with `null` or `undefined` takes the prefix of the other type (`sName?: string`). An unused parameter starts with `_` before its prefix (`_oRes`). A class kept in a variable stays PascalCase (`const Pool = …`), as `new` expects. A callback parameter whose name is passed as is to a public field has no prefix (`.then(onBeforeResult => fnMethod(oReq, { ...oParams, onBeforeResult }))`).

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
- `async`/`await` in general. Express handlers and middlewares chain `.then()` and return the chain: Express 5 sends a rejection to the error handler.
- Errors: an invalid consumer file throws where it is checked (the zod schemas of `core/utils/schemas.ts`) and stops the startup (or the build). No `try`/`catch` to rename or wrap an error: it reaches `NanoApp.start` as it was thrown, with its stack. The framework throws `new NanoError('…')` (`core`): Node shows it as `[nano-app] [ERROR]: …`; with a status (`new NanoError('Not found', 404)`) a handler answers it. Handlers throw a string (400), `{ status, message, warning }` or a `NanoError`.
- Messages: on the console only through `Logger.error`, `Logger.warn` and `Logger.info`, never `console`; in a response through `Logger.message`. The text says the file or thing, what is wrong, and the command that fixes it (``Run `pnpm add drizzle-orm pg`.``).

### Comments and format

- `/** */` above declarations, `//` inside bodies, never `/* */`. A one-line JSDoc on everything exported. Inside a function, a very short comment before each block says what the block does, so the code is never bare: no examples and no reasons why. English.
- No commented-out code, unless a `// TODO:` above it says when it comes back or goes away.
- One line when it reads easily (`if (!oUser) return fnNext({ status: 401 });`). Vertical when it does not: nested objects, calls with several arguments, destructuring.
- Prettier (`.prettierrc.json`): single quotes (backticks only to interpolate; never `+` to join strings, `.join('\n')` for lines), semicolons, 2 spaces, 100 columns, arrow functions without parentheses on one parameter (`oRoute => oRoute.path`). `pnpm format` writes, CI checks.

### Tests

- `node:test` against the real thing: an Express server started by the test and a real database. No mocks.
- Tests and fixtures follow the same style: prefixes and a comment per block.

## Security in code

- Never print secrets: no `cat .env`, no `source .env`, no logging `process.env`. Framework messages never include secrets or connection strings.
- Untrusted input (`req.body`, `req.params`, `req.query`, headers) is validated before the framework uses it. SQL uses parameters (`$1`); identifiers (schema, table) come only from constants.
- Routes are private when the app has `src/auth.ts`: only its endpoints and the plugins mounted before the app are public. Without it every route is public. A plugin that exposes something public says so in its README.
- The error handler answers with the message of what was thrown below 500; a 5xx answers `Internal server error` and is logged in full.
- No DDL at startup: the consumer applies their schemas (and those of the plugins they install) with drizzle-kit; the startup only creates the clients.

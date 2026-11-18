# nano-app

pnpm monorepo: `core/` (private, inlined into the backend, frontend, controllers and mantine), `backend/` (`@nano-app/backend`), `plugins/` (`@nano-app/plugins`), `frontend/` (`@nano-app/frontend`), `controllers/` (`@nano-app/controllers`), `mantine/` (`@nano-app/mantine`). Read the README of the package you touch before changing it.

This file holds the code guidelines. Branches, pull requests, releases and how a development is planned and approved are in [CONTRIBUTING.md](../CONTRIBUTING.md); planned features in [`features/`](../features/README.md).

Before writing or showing any code, read this file again; before pushing, check the whole diff against it.

Before opening a pull request, read [Pull requests](../CONTRIBUTING.md#pull-requests) and [Releases](../CONTRIBUTING.md#releases): the squash commit is its title and description, and it decides whether each package is published.

- The title is `feat:` (minor) or `fix:` (patch) when a package must be published, another type when not. Never a `!` after the type: the `angular` preset ignores the whole commit.
- A breaking change ends the description with `BREAKING CHANGE: <what breaks>`.
- Only a merge that touches a package's paths (`backend/`, `core/`, `plugins/`, `frontend/`, `controllers/`, `mantine/`) runs its publish workflow.

## Clean core

- **A framework for others**: every feature is general, never shaped for one app or one plugin. The consumer gets a small, easy layer (`createRoute`, `createPlugin`, one config object) and the framework does the work behind it. Convention over configuration: a file in the right folder works without registering it.
- **The consumer owns the app**: the security and the rules of an app (what a body may bring, how many records a list answers) are the consumer's. The framework gives the place to set them and never decides them.
- **Least code**: add exactly what the task needs, with the least code possible. No option, default, fallback, retry or `try`/`catch` nobody asked for, and no code for a case nobody has. Prefer reusing what exists, and no change over a small one.
- **Reuse before writing**: before writing anything, check whether an installed dependency (zod, Drizzle, TanStack Query, Better Auth, Express, Next) or `core/` already gives it; when none does, whether a tool that already exists (a library, a CLI, a feature of the platform) solves the problem. A hand-made copy is more code to maintain and leaves the gaps the tool closed.
- **A new dependency** needs a reason a built-in or an installed one cannot cover.
- **A cleanup never changes behavior**: a refactor or a simplification leaves what the framework accepts, rejects, stores and answers as it was. A change of behavior, however small, goes to the plan as a decision before any code.
- **Behavior is the maintainer's decision**: what the framework does with a request, a config, an error, a plugin or the database. Code style is not: follow this file without asking.
- **`core/` is private**: what nothing uses there is deleted. Exported functions of `backend` and `plugins` stay even when nothing in the repo uses them: consumers may.
- **DRY**: one source of truth for each piece of knowledge (a rule, a message, a constant). Code that repeats is extracted the second time it appears (`Logger.warn`), and two branches that make the same call with other arguments build the arguments and call once; no abstraction for a single use.
- **Single responsibility**: a function does one thing, a file has one job. A file over ~120 lines, or a function you cannot read in one screen, is a sign to split or simplify.
- **Fail fast**: invalid configuration fails at startup with a clear message, not on the first request. When something is missing, fail instead of guessing.
- **Validate at the boundaries**: data from outside (requests, consumer files, env) is checked once where it enters; inside, types are trusted.
- **Immutability**: `const` by default, `let` only when a value changes. Do not mutate parameters; return a new value.
- **No private members**: never read what an object keeps for itself (`db._`, a field with `_`). What a piece of code needs comes in as an option or a parameter.
- **A condition once**: a function tests each condition one time. When two places need its answer, decide both there (`const oRead = id ? { page, answer: first } : { answer: list };`).
- **Least surprise**: names say what a thing does and nothing more; a function named `get` has no side effects.
- **HTTP semantics**: `GET` reads and never changes state; status codes mean what the standard says (400 bad input, 401 not authenticated, 403 not allowed, 404 not found, 5xx server fault).
- **Tests describe behavior**, not implementation: they call the public API and check what a consumer sees.
- **Boy Scout rule**: code you touch for a task follows this file when you leave it; code you do not touch stays as is.

## Code style

Match `core/` and `backend/src/`. The simplest code that works wins.

### Structure

- The backend's `src/` folders follow its composition, `app/` → `plugins/` → `database/` and `router/`: a file imports down that chain, never up. `lib/` (the public creators) sits on top; `auth/`, `types/` and `const.ts` serve any of them.
- Up to 3 positional parameters; with more, one object (`DatabaseConfig`).
- A class when there is state (`Plugin`, `Drizzle`), abstract when its subclasses fill it (`DatabaseClient`); `abstract class` with `static` methods for stateless utilities grouped by area (`FileReader`, `Validator`). Public API is plain functions (`createRoute`, `createPlugin`).
- A controller is a class that extends `Controller`: its fields first (only values that read the context or the options, `oApi = this.stores.backend;`), then `onMount` and `onUnmount` (`onMount` reads what the view needs), then the methods. No hooks or effects in it. Logic lives in the methods: one reaches another with `this` (`last() { return this.items()[0]; }`, method syntax, never an arrow field), also from `onMount`; an override reaches the original with `super`. Its options are fields the subclass sets, `abstract` when they have no default; the base reads them in its methods, never in a field (the subclass's fields are set after the base's). The view of `createView` renders; its only hook is a `useEffect` that calls a method when a value changes (`useEffect(controller.guard, [backend.get('/session')]);`).
- The object of `createRoute` goes in order: its config (`expression`, `public`, `permissions`), then `callbacks`, then the handlers (`GET`, `POST`…).
- The function of `createPlugin` returns its config: its keys first (`name`, `basePath`, `routesDir`, `routes`, `options`), then `callbacks`. Before the `return` only `const` that read the options; no functions. Logic lives in the callbacks: what a callback needs is a `const` at its start (`const fnRefill = …`).
- `public`, `protected` or `private` on every class method and field; constructors go without.
- Declared functions and methods state their return type (`: Promise<void>`); inline callbacks infer it, and so does the factory of a component (`list`), from the controller it returns.
- Prefer `unknown` and validate over `any`.
- Types are declared where values are born and inferred from there. Data from outside (JSON, env) gets a typed variable where it enters (`const STORES: [string, StoreFile][] = JSON.parse(…)`).
- `core/` holds only what two or more packages use; what one package uses lives in it. Module constants go in the `const.ts` of the piece that uses them, beside it (`mantine/src/layout/shell/const.ts`); those several pieces of a package share go in the `const.ts` of the package, and those of several packages in `core/const.ts`. A file exports only what another file uses.
- Types in a `types/` folder of the package, one file per area (`types/app.ts`, `types/plugin.ts`). `type`, not `interface`. `import type` for types.
- Generic objects are `NanoObject` (`core/types/objects.ts`), with the value type when it is known (`NanoObject<Store>`), never `object` or `Record<string, …>`.
- Files: PascalCase when they export a class (`FileLoader.ts`), lowercase otherwise (`creators.ts`, `const.ts`).
- `export default` when a file exports one thing, also the official plugins (`import health from '@nano-app/plugins/health'`). Named exports for files that export several.
- Imports in groups: Node built-ins with `node:` (`node:fs`), dependencies, `@nano-app/*`, relative files, then every `import type` in the same order. Optional dependencies are imported when needed (`await import('pg')`), never at the top.

### Views

The views of `@nano-app/mantine`, and of any app on it:

- **Responsive by default**: every view works on a phone, a tablet and a desktop with no extra step. Layout comes from Mantine's components (`Container`, `Stack`, `Group` with `wrap`, `SimpleGrid`, `Grid`, `Flex`) and their props.
- Sizes and spacing are theme tokens (`size="xs"`, `p="md"`, `gap="lg"`, `fz="sm"`), changed per breakpoint with an object (`cols={{ base: 1, sm: 2, lg: 3 }}`, `p={{ base: 'sm', md: 'xl' }}`) or with `visibleFrom` and `hiddenFrom`.
- A view with columns uses `Grid`, always of 12 columns, with a `span` per breakpoint (`<Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>`): never another `columns` count.
- No fixed values: no `px`, `rem` or plain numbers for widths, heights, fonts or spacing, and no `style` with sizes. A full width or height is a relative unit (`w="100%"`, `mih="100dvh"`).
- A view that reads data shows `Skeleton` of Mantine in its place while its controller is busy (`<Skeleton visible={users.isBusy()}>…</Skeleton>`), with the shape of what it loads.
- Logic lives in `@nano-app/controllers`, views in `@nano-app/mantine`: mantine has no controllers. Its views take a controller of `@nano-app/controllers` as it is, and give it what it needs through props (`store`, `home`, `components`); a controller that needs an option a view cannot give takes it as a prop.
- `@nano-app/mantine` keeps its pieces by kind. `components/<type>/` groups the views of a type, with an `index.ts` that exports them; every piece and its public types leave from `src/index.ts`, the only import path, `@nano-app/mantine`. A view alone is a file (`fields/Input.tsx`); a view with pieces of its own is a folder of its name, with `<View>.tsx` and `components/` (`notification/Toasts/`). A page is the same folder under `pages/<name>/`, with an `index.tsx` that gives `create<Name>Page` and its texts. A piece another view needs moves up to `components/`.
- `@nano-app/controllers` groups its controllers by theme under `src/` (`auth/Auth.controller.ts`, `auth/Login.controller.ts`, `form/`), a controller alone as a file (`Collection.controller.ts`); every one leaves from `src/index.ts`, the only import path, `@nano-app/controllers`. A controller lives in `<Name>.controller.ts`: the one exception to PascalCase files that export a class.

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

A union with `null` or `undefined` takes the prefix of the other type (`sName?: string`). An unused parameter starts with `_` before its prefix (`_oRes`). A class kept in a variable stays PascalCase (`const Pool = …`), as `new` expects. A variable or callback parameter born to fill a field of the same name has no prefix, so the shorthand reads (`const db = await DatabaseManager.mount(…); { ...options, db }`, `.then(onBeforeResult => fnMethod(oReq, { ...oParams, onBeforeResult }))`).

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
- `??` for defaults. `||` only when `0`, `''` or `NaN` must also take the default (`message || 'nano.error.internal'`).
- `for...of` to iterate when nothing is returned, never `.forEach` (it does not wait for `await`). `.map`, `.filter` and `.some` when they return something.
- `async`/`await` in general. Express handlers and middlewares chain `.then()` and return the chain: Express 5 sends a rejection to the error handler.
- Errors: an invalid consumer file throws where it is checked (the zod schemas of `backend/src/router/validations.ts` and `frontend/src/utils/validations.ts`) and stops the startup (or the build). No `try`/`catch` to rename or wrap an error: it reaches `NanoApp.start` as it was thrown, with its stack. The framework throws `new NanoError('…')` (`core`): Node shows it as `[nano-app] [ERROR]: …`; with a status (`new NanoError('nano.error.notFound', 404)`) a handler answers it. Handlers throw a string (400), `{ status, message, type }` (`type` `warning` or `error`, `error` by default) or a `NanoError`.
- Messages: on the console only through `Logger.error`, `Logger.warn` and `Logger.info`, never `console`; in a response through `Logger.message`. The text says the file or thing, what is wrong, and the command that fixes it (``Run `pnpm add drizzle-orm pg`.``).

### Comments and format

- `/** */` above declarations, `//` inside bodies, never `/* */`. A one-line JSDoc on everything exported. Inside a function, a very short comment before each block says what the block does, so the code is never bare: a few words on one line, under 80 columns, with no examples, no reasons why and no list of every case. A JSDoc is one short sentence too. English.
- No commented-out code, unless a `// TODO:` above it says when it comes back or goes away.
- One line when it reads easily (`if (!oUser) return fnNext({ status: 401 });`). Vertical when it does not: nested objects, calls with several arguments, destructuring.
- Prettier (`.prettierrc.json`): single quotes (backticks only to interpolate; never `+` to join strings, `.join('\n')` for lines), semicolons, 2 spaces, 100 columns, arrow functions without parentheses on one parameter (`oRoute => oRoute.path`). `pnpm format` writes, CI checks.

### Tests

- `node:test` against the real thing: an Express server started by the test and a real database. No mocks.
- Tests and fixtures follow the same style: prefixes and a comment per block.

## Security in code

- Never print secrets: no `cat .env`, no `source .env`, no logging `process.env`. Framework messages never include secrets or connection strings.
- Untrusted input (`req.body`, `req.params`, `req.query`, headers) is validated before the framework uses it. SQL uses parameters (`$1`); identifiers (schema, table) come only from constants.
- Routes are private when `createNanoApp` has `auth`: only its endpoints and the routes with `public: true` are public. Without it every route is public. A plugin that exposes something public says so in its README.
- The error handler answers with the message of what was thrown below 500; a 5xx answers `nano.error.internal` and is logged in full.
- Every message a response carries is a key of the texts (`nano.error.notFound`), never a sentence: the frontend shows it in the user's locale.

# Features

Planned work on this repository, one file per feature. A file says what the feature has to do, what it leaves out, when it is done and where it stands, so any agent can pick it up from here. Read [`.claude/CLAUDE.md`](../.claude/CLAUDE.md) first: it defines the branch of each development, the modules when the maintainer splits a feature, and the approval point by point.

| Feature | Done when | Depends on |
|---|---|---|
| [typed-paths](typed-paths.md) | A mistyped store path or injected resource does not compile | — |
| [example-app](example-app.md) | An app built on the published packages builds its images | typed-paths |
| [migrations](migrations.md) | `migrate` applies the app's and its plugins' migrations, with history | — |
| [response-contract](response-contract.md) | A handler answers 201, 404 and 409 without throwing, and the frontend sees them | — |
| [error-component](error-component.md) | The test app shows a failed read and a failed write with the component | — |
| [frontend-auth](frontend-auth.md) | The test app signs in, shows the session and protects a route | — |
| [components-next](components-next.md) | `form` and `login` are released and the test app renders them | error-component, frontend-auth |
| [image-contract](image-contract.md) | The image contract is written and the example app meets it | migrations, example-app |
| [automatic-crud](automatic-crud.md) | Every exposed model is REST without writing a route (1.0) | response-contract |
| [create-nano-app](create-nano-app.md) | A generated app starts, migrates and builds its images | example-app, migrations |
| [sse](sse.md) | The backend pushes an event and a component updates | Only when the maintainer asks |

The order of the table is the order of work. Work outside this repository (cluster, deploys, apps) is not tracked here.

## Taking a feature

Each file starts with a frontmatter:

```yaml
status: todo        # todo → in-progress → review → done; blocked when something external is missing
owner: null         # the session working on it
depends_on: []      # features that must be done first
updated: 2026-10-23
```

1. Take a feature only if it is `todo`, has no `owner` and everything in `depends_on` is `done` (or its file no longer exists). Set `status: in-progress`, `owner` and `updated`. If it already has an owner, ask that session.
2. Work only inside its scope. New work that shows up goes to the log as a proposal, not to the code.
3. Append to `## Log`, never edit earlier entries: `- 2026-10-23 · <owner> · what was done / what is missing`.
4. A question only the maintainer can answer goes to the log, and the feature becomes `blocked`.
5. To close: `status: review` with a summary in the log. It becomes `done` when the maintainer validates it. When the feature reaches `main`, its file is deleted; what stays true goes to the README of the package.

## Before reporting a module

- Review the whole diff against `.claude/CLAUDE.md`: green checks do not cover the style.
- Run the tests of the touched package, `tsc` of core, frontend and backend, `pnpm format:check` and the build. For the frontend, also `next build` of `frontend/tests/app`.
- The tests that count are the GitHub Actions checks. Local backend failures against the shared database of `.env` do not block; never run two backend suites at once against it.
- Say what could not be verified (rendering in a browser: the container has no Chromium).
- Pull requests are squash-merged: the title is the commit and decides the release (`feat` and `fix` release; `refactor`, `test`, `docs` and `chore` do not). Before rewriting history, leave a `backup/<topic>-<something>` branch.

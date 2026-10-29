# Features

Planned work on this repository, one file per feature. A file says what the feature has to do, what it leaves out, when it is done and where it stands, so any agent can pick it up from here. Read [`.claude/CLAUDE.md`](../.claude/CLAUDE.md) first: it defines the branch of each development, the modules when the maintainer splits a feature, and the approval point by point.

| Feature | Done when | Depends on |
|---|---|---|
| [typed-paths](typed-paths.md) | A mistyped store path or injected resource does not compile | — |
| [example-app](example-app.md) | An app built on the published packages builds its images | typed-paths |
| [components-next](components-next.md) | `form` and `auth` are released and the test app renders them | — |
| [image-contract](image-contract.md) | The image contract is written and the example app meets it | example-app |
| [automatic-crud](automatic-crud.md) | Every exposed model is REST without writing a route (1.0) | — |
| [create-nano-app](create-nano-app.md) | A generated app starts, migrates and builds its images | example-app |
| [scheduler](scheduler.md) | A job declared in the `scheduler` plugin runs on its cron, in its timezone | — |
| [mail](mail.md) | A route sends an email through the `mail` plugin | scheduler |
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

## Breaking down a feature

A large idea reaches code in small steps, each one approved by the maintainer before the next.

1. Analysis: check the real state (this repository, personal-app, what can be reused) and answer briefly what exists, what is missing and what is reused.
2. Split: propose 3 to 6 tasks, each with its "done when", and the dependency tree between them. The maintainer adjusts or approves it.
3. Iterate: take the first task of the tree with no pending dependency. If it is still large (more than one pull request, or more than 3 decisions), split it again and show the sub-tree. Repeat until every task is simple.
4. Define the task, before any decision: what it does (what comes in, what goes out) and its scope (what it covers, what it leaves to other tasks), with its "done when". The maintainer approves it.
5. Decide: at most 3 decisions per message, each with options (A, B, …) and one marked as the recommendation, so the maintainer can answer in one line (`1A 2B 3A`).
6. Implement: only the approved task, following [New development](../.claude/CLAUDE.md). Show the diff, stage it, then update the feature and move to the next task of the tree.
7. Record: the tree lives in the feature's `## Modules` (task, what it does, what it depends on) and every decision in its `## Log`, so anyone resumes from the file.

## Before reporting a module

- Review the whole diff against `.claude/CLAUDE.md`: green checks do not cover the style.
- Run the tests of the touched package, `pnpm exec tsc --noEmit -p <package>` of core, frontend, components and backend, `pnpm format:check` and the build. For the frontend, also `next build` of `frontend/tests/app`.
- The tests that count are the GitHub Actions checks. Local backend failures against the shared database of `.env` do not block; never run two backend suites at once against it.
- Say what could not be verified (rendering in a browser: the container has no Chromium).
- Pull requests are squash-merged: the title is the commit and decides the release (`feat` and `fix` release; `refactor`, `test`, `docs` and `chore` do not). Before rewriting history, leave a `backup/<topic>-<something>` branch.

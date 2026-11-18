# @nano-app/create

Creates an app on nano-app: a backend and a frontend in one pnpm workspace, on the published packages.

```bash
pnpm create @nano-app my-app
cd my-app
pnpm install
cp .env.example .env
pnpm dev
```

- The name is the folder of the app and the `name` of its root `package.json`: lowercase, digits, `.`, `_` and `-`. A folder that already exists stops the command.
- The app is the [`template/`](https://github.com/Nano-Nathan/nano-app/tree/main/template) of this repository at the version of the command: its README says what it has.
- Its dependencies take the latest versions of their ranges at `pnpm install`, which writes `pnpm-lock.yaml`: the images need it.

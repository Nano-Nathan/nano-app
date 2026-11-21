# @nano-app/mantine

[Mantine](https://mantine.dev) for `@nano-app/frontend`: the root layout, the views of `@nano-app/controllers` and ready pages.

```bash
pnpm add @nano-app/mantine @nano-app/frontend @nano-app/controllers @mantine/core @mantine/hooks @mantine/notifications
```

- `@mantine/*` 9, `@nano-app/frontend` 0.16, `@nano-app/controllers` 0.13, Next 16.3 and React 19 or newer, as peer dependencies.
- Two imports: the layouts and pages from `@nano-app/mantine/server` (`import { createLayout, createShell } from '@nano-app/mantine/server'`), in server components; the views from `@nano-app/mantine` (`import { Form } from '@nano-app/mantine'`), also in client components.

## createLayout

The root layout: `<html>` in the user's locale, the color scheme script, Mantine's styles, `MantineProvider`, `NanoAppProvider` and the toasts.

```tsx
// src/app/layout.tsx
export default createLayout({ lang: 'es', provider: { theme } });
```

| Option          | Description                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------- |
| `lang`          | The language until the user picks one with `setLocale`.                                      |
| `colorScheme`   | `light`, `dark` or `auto` (default), until the user picks one.                               |
| `provider`      | Props of `MantineProvider` (`theme`…).                                                       |
| `notifications` | Props of Mantine's `Notifications`: `position` (`top-right`), `autoClose` (`3000`), `limit`… |

- The layout reads the locale cookie, so every page is dynamic.
- Start `theme.ts` with `'use client'`: a theme with functions fails on the server otherwise.
- nano-app's theme sits under the app's: glass `Paper` and `Card`, `Title` and `Avatar` in the primary color, `NavLink` `filled`. Every accent comes from `primaryColor`.
- Icons and manifest come from Next: `app/icon.png`, `app/apple-icon.png`, `app/manifest.ts`.

## createShell

The layout of the pages with a session: a navbar with the logo, the app's links and the framework's items.

```tsx
// src/app/(private)/layout.tsx
export default createShell({
  title: 'finance',
  logo: '/icon.png',
  links: [
    { href: '/', label: 'nano.shell.home', icon: <IconHome /> },
    { href: '/accounts', label: 'accounts.title', icon: <IconCash /> },
  ],
  items: { theme: false },
});
```

| Option  | Description                                                                                                                         |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `title` | The app's name.                                                                                                                     |
| `logo`  | Path of its image; the initials of `title` without one.                                                                             |
| `links` | The app's links, `{ href, label, icon, roles }` in order, or groups `{ label, icon, roles, links }`. `label` is a key of the texts. |
| `items` | The framework's items, each on or off (below).                                                                                      |
| `login` | Where it goes without a session and after signing out, `/login` by default.                                                         |

| Item     | Default | Shows                                                       |
| -------- | ------- | ----------------------------------------------------------- |
| `user`   | on      | The user of the session: photo or initials, name and email. |
| `theme`  | on      | The switch of the color scheme.                             |
| `logout` | on      | The sign-out.                                               |

- A header card above the page shows the button that opens the navbar and, in the middle, the text of the current page's link.
- A group shows its links under it when clicked; closed, clicking it opens the navbar with them.
- A link with `roles` shows only to a user whose `role` (Better Auth's admin plugin) is one of them.
- It asks the session with `createPage`. Each page keeps its own `createPage`: Next does not render a layout again on navigation.
- The navbar is closed by default: icons only on a desktop, hidden on a phone. A button at the top left opens it. Following a link closes it.
- Its state is the flag of `NavController`, at `/nav/isToggled` of `app`.
- Texts: `nano.shell.home`, `nano.shell.theme`, `nano.shell.logout`, `nano.shell.menu`; for the admin group, `nano.admin.title` and `nano.admin.users`.

## Components

| Component   | Controller          | Props                                    |
| ----------- | ------------------- | ---------------------------------------- |
| `Input`     | `FieldController`   | `form`, `field` (`label`, `type`)        |
| `Password`  | `FieldController`   | `form`, `field` (`label`)                |
| `Form`      | `FormController`    | `name`, `fields`, `onSubmit`, `children` |
| `Toasts`    | `MessageController` | Props of Mantine's `Notifications`       |
| `DataTable` | `TableController`   | `path`, `columns` (`Field[]`, optional)  |

- `Form` shows `password` fields with `Password`, every other one with `Input`, then its `children` (the buttons).
- `DataTable` shows a column per field of `columns` (`label`, `format`), or per column of the table without it, and a row per item of `path`, read when it mounts. Without items it shows a row with `nano.table.empty`. A column of the table, without `columns`, shows `nano.label.<name>`: the core texts have `id`, `name`, `email`, `title`, `description`, `createdAt` and `updatedAt`; define the others in the app's texts, or give the column its `label`. It scrolls inside itself past `70svh` high, and sideways when the screen is narrower than its content.
- `Toasts` shows every new message of an api store in the color of its `type` (`success` green, `error` red, `info` blue, `warning` yellow). `createLayout` mounts it.

## createLoginPage

```tsx
// src/app/login/page.tsx
export default createLoginPage({ providers: ['google'] });
```

| Option         | Default        | Description                                                |
| -------------- | -------------- | ---------------------------------------------------------- |
| `home`         | `/`            | Where it goes after signing in, or at once with a session. |
| `providers`    | `[]`           | A button per social provider of Better Auth.               |
| `fields`       | `LOGIN_FIELDS` | Fields of the sign-in: email and password.                 |
| `signUpFields` | `fields`       | Fields of the sign-up.                                     |
| `signUp`       | `true`         | `false` hides the link to sign up.                         |

- A page with its own `fields` starts with `'use client'`: a zod schema cannot go from a server component.
- State: `/form/login` and `/auth/isToggled` of `app`.
- Texts: `nano.login.*`: `title`, `subtitle`, `divider`, `noAccount`, `haveAccount`, `email`, `password`, `submit`, `register`, `invalidEmail`, `required`, `google`.

## createNotFoundPage

```tsx
// src/app/not-found.tsx
export default createNotFoundPage({});
```

| Option | Default | Description             |
| ------ | ------- | ----------------------- |
| `home` | `/`     | Where its button leads. |

Texts: `nano.notFound.title`, `nano.notFound.description`, `nano.notFound.home`.

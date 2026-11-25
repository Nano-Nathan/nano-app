# @nano-app/mantine

[Mantine](https://mantine.dev) for `@nano-app/frontend`: the root layout, the views of `@nano-app/controllers` and ready pages.

```bash
pnpm add @nano-app/mantine @nano-app/frontend @nano-app/controllers @mantine/core @mantine/dates @mantine/hooks @mantine/notifications @mantine/nprogress dayjs
```

- `@mantine/*` 9, `@nano-app/frontend` 0.16, `@nano-app/controllers` 0.13, Next 16.3 and React 19 or newer, as peer dependencies.
- Two imports: the layouts and pages from `@nano-app/mantine/server` (`import { createLayout, createShell } from '@nano-app/mantine/server'`), in server components; the views from `@nano-app/mantine` (`import { Form } from '@nano-app/mantine'`), also in client components.

## createLayout

The root layout: `<html>` in the user's locale, the color scheme script, Mantine's styles, `MantineProvider`, `NanoAppProvider` and the toasts.

```tsx
// src/app/layout.tsx
export default createLayout({ lang: 'es', provider: { theme } });
```

| Option          | Description                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lang`          | The language until the user picks one with `setLocale`.                                                                                            |
| `className`     | Classes of the html: the `variable` of each `next/font`, so the fonts load with the page; the theme reads them (`fontFamily: 'var(--font-text)'`). |
| `colorScheme`   | `light`, `dark` or `auto` (default), until the user picks one.                                                                                     |
| `provider`      | Props of `MantineProvider` (`theme`…).                                                                                                             |
| `notifications` | Props of Mantine's `Notifications`: `position` (`top-right`), `autoClose` (`3000`), `limit`…                                                       |

- The layout reads the locale cookie, so every page is dynamic.
- Start `theme.ts` with `'use client'`: a theme with functions fails on the server otherwise.
- nano-app's theme sits under the app's. Every text is in the text's color; titles of any kind (`Title`, modals, table headers, the brand of the shell) take the headings' font and weight, and the sizes of its scale: the page `h2`, modals, drawers and the brand `h3`, table headers and notifications `h5`. Every other text is `sm` (`Text` and `Anchor`), and the views give no size, radius or weight of their own: corners, sizes and weights come from the theme. The primary color is only on what acts (buttons, icons, active links, hover, focus) and on borders and lines. Corners are `md` everywhere, cards included, as the browser's window; `Paper` and `Card` are glass, with a border of the primary color; `Modal` fades in centered over a light overlay that blurs the page, as one solid card on the ground of the app under the same veil as the glass cards, fixed to the screen so it shows the part of the ground behind it as strong as they do (a fade, since a transform would undo the fixed ground), its title centered and apart by a line; it has no close button. Tables scroll without bars and fill the height they are given; they are a grid whose header, body and rows share the columns (`subgrid`, widths from the content), so only the body scrolls, from the line below the header, and every card stays glass; and their rows are rounded bands of one neutral tint that take the primary color on hover and focus (the rules of `NANO_CSS`, in the layout's `<head>`, for the class `nano-table`). Dimmed texts and red buttons reach a 4.5:1 contrast; on light, so do the placeholders of inputs, and their borders 3:1 (dark, focus and error keep Mantine's), and motion runs only when the system allows it. `NavLink` is `filled`.
- The values of the look an app can change are `TOKENS` (`mantine/src/const.ts`), each through a CSS variable `--nano-<name>`, else its default: `tint` and `glow` of the ground, `veil` of glass cards and dialogs, `border`, `row`, `row-hover`, `row-gap` and `row-motion` of tables, `placeholder`, `heading-spacing`, `dialog-room` and `dialog-room-below`. Set them where the app sets its CSS variables, as its `cssVariablesResolver`. The size of each title comes from `HEADINGS` (page `2`, modal, drawer and brand `3`, column and notification `5`); the modal's transition and overlay are props, changed with the app's theme (`Modal.defaultProps`).
- Icons and manifest come from Next: `app/icon.png`, `app/apple-icon.png`, `app/manifest.ts`.

## createShell

The layout of the pages with a session: a navbar with the logo, the app's links and the framework's items.

```tsx
// src/app/(private)/layout.tsx
export default createShell({
  title: 'finance',
  logo: '/icon.png',
  links: [
    { href: '/', label: 'nano.page.', icon: <IconHome /> },
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

- A header card above the page shows the button that opens the navbar and, beside it, the title of the page: the text of `nano.page` and its path with dots (`/admin/users` → `nano.page.admin.users`, `/` → `nano.page.`).
- The cards of the shell overlap by the width of a border where they meet, so each joint shows one line.
- The shell is as high as the screen: the page scrolls inside its card, so a view that fills its height (`DataTable`) scrolls inside itself.
- A group shows its links under it when clicked; closed, clicking it opens the navbar with them.
- A link with `roles` shows only to a user whose `role` (Better Auth's admin plugin) is one of them.
- It asks the session with `createPage`. Each page keeps its own `createPage`: Next does not render a layout again on navigation.
- The navbar is closed by default: icons only on a desktop, hidden on a phone. A button at the top left opens it. Following a link closes it.
- Its state is the flag of `NavController`, at `/nav/isToggled` of `app`.
- Texts: `nano.shell.theme`, `nano.shell.logout`, `nano.shell.menu`, and `nano.admin.title` for the admin group. The core texts have the titles `nano.page.` (`/`) and `nano.page.admin.users`; the app adds those of its pages, and its texts go over the core's.

## Components

| Component   | Controller           | Props                                                                 |
| ----------- | -------------------- | --------------------------------------------------------------------- |
| `Input`     | `FieldController`    | `form`, `field` (`label`, `type`)                                     |
| `Password`  | `FieldController`    | `form`, `field` (`label`)                                             |
| `Numeric`   | `FieldController`    | `form`, `field` (`label`)                                             |
| `Select`    | `FieldController`    | `form`, `field` (`label`, `options`)                                  |
| `Switch`    | `FieldController`    | `form`, `field` (`label`)                                             |
| `Calendar`  | `FieldController`    | `form`, `field` (`label`)                                             |
| `Form`      | `FormController`     | `name`, `fields`, `onSubmit`, `children`                              |
| `Dialog`    | none                 | `opened`, `onClose`, `title`, `cancel`, `submit`, `start`, `children` |
| `Toasts`    | `MessageController`  | Props of Mantine's `Notifications`                                    |
| `Progress`  | `ProgressController` | Props of Mantine's `NavigationProgress`                               |
| `DataTable` | `TableController`    | `path`, `columns` (`FormField[]`, optional)                           |

- Each field shows its placeholder (`placeholder()` of `FieldController`), and `Switch` none.
- `Form` shows each field by its `type`: `password` with `Password`, `number` with `Numeric` (`NumberInput`), `select` with `Select`, `switch` with `Switch`, `date` with `Calendar` (`DatePickerInput` of `@mantine/dates`, it keeps `YYYY-MM-DD`), every other one with `Input`; then its `children` (the buttons). Its `id` is its `name`: a button outside it sends it with `form={name}`.
- The dates show in the user's locale, else the layout's `lang`: `en` and `es`.
- `DataTable` shows a column per field of `columns` (`label`, `format`), or per column of the table without it, and a row per item of `path`, read when it mounts. Without items it shows, under its header and in all the space left, an icon and `nano.table.empty`. Above it, `nano.table.create` opens the form of a new row in a modal; a click on a row, or Enter on it, opens its form in the same modal, whose `nano.table.delete` deletes it after a confirmation. The form shows the same fields as the columns, validated as they are typed and on submit; its submit says `nano.table.create` for a new row and `nano.table.save` for one that exists. While its rows are still to come it shows `Skeleton`. Texts: `nano.table.*`: `empty`, `create`, `edit`, `delete`, `save`, `cancel`, `confirm`. A column of the table, without `columns`, shows `nano.label.<name>`: the core texts have `id`, `name`, `email`, `title`, `description`, `createdAt` and `updatedAt`; define the others in the app's texts, or give the column its `label`. It fills the height of its parent and scrolls inside it, also sideways when the screen is narrower than its content, without showing the bars.
- `Dialog` is the modal of nano-app: `title`; its content as `children` with `xl` room above and half more below; and under a line `start` (an action apart, at the left), a cancel button with the text `cancel` and `submit`; the cancel and the overlay close it with `onClose`.
- `Progress` shows a thin bar of the primary color at the top of the screen while a request of any api store is out (a page that loads its data, a create, a delete), and from a click on a link of the app to another path until that page arrives. `createLayout` mounts it.
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
- Texts: `nano.login.*`: `title`, `subtitle`, `divider`, `noAccount`, `haveAccount`, `email`, `password`, `submit`, `register`, `google`; and `nano.form.invalidEmail` and `nano.form.required`, the messages of its fields, for any form.

## createNotFoundPage

```tsx
// src/app/not-found.tsx
export default createNotFoundPage({});
```

| Option | Default | Description             |
| ------ | ------- | ----------------------- |
| `home` | `/`     | Where its button leads. |

Texts: `nano.notFound.title`, `nano.notFound.description`, `nano.notFound.home`.

# @nano-app/mantine

[![mantine](https://img.shields.io/npm/v/@nano-app/mantine?label=mantine)](https://www.npmjs.com/package/@nano-app/mantine)

[Mantine](https://mantine.dev) for [`@nano-app/frontend`](https://www.npmjs.com/package/@nano-app/frontend): the root layout, the views of [`@nano-app/controllers`](https://www.npmjs.com/package/@nano-app/controllers) and ready pages. Every piece leaves from one import: `import { createLayout, createShell, createLoginPage, Input } from '@nano-app/mantine'`. Each client view keeps its `'use client'`, so a server page and a client component import from the same place.

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.
- `@mantine/core`, `@mantine/hooks` and `@mantine/notifications` 9, `@nano-app/frontend` 0.16, `@nano-app/controllers` 0.13, Next 16.3 and React 19 or newer, as peer dependencies.

```bash
pnpm add @nano-app/mantine @nano-app/frontend @nano-app/controllers @mantine/core @mantine/hooks @mantine/notifications
```

## Layout

`createLayout` gives the root layout: the `<html>` of the user's locale (its cookie, see [Texts](../frontend/README.md#texts)) or of `lang` with Mantine's attributes, the script of the color scheme in `<head>`, Mantine's styles, `MantineProvider`, `NanoAppProvider` and the errors (see [Errors](#errors)).

```tsx
// app/layout.tsx
import { createLayout } from '@nano-app/mantine';
import theme from '@/theme';

export const metadata = { title: 'finance' };

export default createLayout({ lang: 'es', provider: { theme } });
```

```ts
// src/theme.ts
'use client';

import { createTheme } from '@mantine/core';

export default createTheme({ primaryColor: 'teal' });
```

- Its options go by the component they reach:
  - `lang`: the language of the html until the user picks one with `setLocale`. The layout reads the user's cookie, so every page is dynamic.
  - `colorScheme`: `light`, `dark` or `auto` (by default: the system's), until the user picks one. It reaches `MantineProvider` and the script of the `<head>` alike, so the first render has the right colors.
  - `provider`: the props of `MantineProvider` (`theme`…), as they are.
- Every page stands on one ground: the body with a glow of the theme's primary color in two corners. Under the app's `theme` goes the theme of nano-app, which the app's overrides part by part: `Paper` and `Card` of glass (translucent, the ground blurred behind them, the border in the primary color), `Title` in the primary color, `Avatar` in the primary color by default and `NavLink` `filled` by default. Every accent comes from `primaryColor`, so an app sets its colors there.
  - `notifications`: the props of Mantine's `Notifications` (see [Notifications](#notifications)), as they are.
- The layout is a server component and `MantineProvider` a client one: a prop that holds a function (a theme with `Button.extend`, `styles` or `vars` as functions, a `colorSchemeManager`) fails on the server. Start `theme.ts` with `'use client'`, as above: then any theme works.
- The page's `<head>` comes from Next: `metadata` in the layout or in each page, and an app installable on a phone from `app/manifest.ts` and the icons `app/icon.png` and `app/apple-icon.png`, which Next links by itself.

## Shell

`createShell` gives the layout of the pages with a session: a navbar the whole height with the logo and the title and a link per option, the user and a sign-out, and the page. Put it in the layout of a route group, so `/login` stays out of it:

```tsx
// app/(private)/layout.tsx
import { IconHome } from '@tabler/icons-react';
import { createShell } from '@nano-app/mantine';

export default createShell({
  title: 'finance',
  logo: '/icon.png',
  links: [{ href: '/', label: 'nano.shell.home', icon: <IconHome /> }],
});
```

- `links` are the options of the navbar, in order: `href` the path it leads to, `label` the key of its text, `icon` an element before it. The link of the current page is active, and following one closes the navbar on a phone. A link is a `Link` of Next: the layout stays mounted and only the page changes.
- `login` is where it goes without a session and after signing out, `/login` by default. The layout asks the session with `createPage` (see [Pages with a session](../frontend/README.md#pages-with-a-session)) and shows its user: the photo of its provider (`image`) or the initials of its `name`, and its `name` and `email` beside it, in a tooltip while the navbar is closed; Next does not render a layout again on a navigation, so each page keeps its own `createPage`.
- `logo` is the path of the image of the app (`/icon.png` of `public/`), the initials of `title` without one.
- The shell is Mantine's `AppShell`, with the sizes of its docs: the navbar `300` open and `74` closed (numbers are rem scaled by the theme). The navbar and the page float on the ground of the app as rounded cards (`Paper`), with no margin; the links have rounded corners, their icons and the title in the primary color, and the current one filled with it. The navbar is closed by default (`layout="alt"` of `AppShell`, with no header), and a button at the top left of the page opens and closes it: on a phone it hides, and opens over the whole width with a close button by the title; on a desktop it keeps only the icons, each text in a tooltip. Its width changes with the transition of `AppShell`, and its texts fade with it. Following a link closes it, so every link needs its `icon`.
- The state of the navbar is the flag of `NavController`, at `/nav/isToggled` of `app`: on, the navbar is open. Below the user, a button switches between the light and the dark color scheme of Mantine, which keeps the choice in `localStorage`; its text is the key `nano.shell.theme`. The sign-out is `signOut` of `AuthController`; its text is the key `nano.shell.logout`, the button's `nano.shell.menu`, and `nano.shell.home` gives a link to the home its text.

## Components

Views of `@nano-app/controllers`, with Mantine. Their logic is the controller's: see [its README](../controllers/README.md).

| Component  | Import                                         | Controller        | Props                                    |
| ---------- | ---------------------------------------------- | ----------------- | ---------------------------------------- |
| `Input`    | `import { Input } from '@nano-app/mantine'`    | `FieldController` | `form`, `field` (`label`, `type`)        |
| `Password` | `import { Password } from '@nano-app/mantine'` | `FieldController` | `form`, `field` (`label`)                |
| `Form`     | `import { Form } from '@nano-app/mantine'`     | `FormController`  | `name`, `fields`, `onSubmit`, `children` |

`Input` is a `TextInput` with the text of the field's `label` (a key of the texts) and its `type`, its value and its error. `Password` is a `PasswordInput`, with a toggle that shows the password. `Form` shows each `password` field with `Password`, every other one with `Input`, and then its `children`, the buttons:

```tsx
<Form
  name="note"
  fields={[{ name: 'title', label: 'notes.title', validation: z.string('notes.required') }]}
  onSubmit={notes.add}
>
  <Button type="submit">Save</Button>
</Form>
```

## Notifications

`createLayout` mounts `Toasts`, Mantine's `Notifications` with the messages of the backend among them: every new message of an api store (its `/message/list`, see [`MessageController`](../controllers/README.md#message)) shows as a toast with the text of its message (a key, see [Texts](../frontend/README.md#texts)), of its `type` (the backend's, or `success` or `error` by its result) in its color: `success` green, `error` red, `info` blue, `warning` yellow, and its list is emptied. An app does nothing to show what the backend answers.

`notifications` of `createLayout` takes the props of Mantine's `Notifications`: `position` (`top-right` by default), `autoClose` (3000 ms by default, `false` to keep them until closed), `limit`…

```tsx
createLayout({ lang: 'es', notifications: { position: 'bottom-right', autoClose: 5000 } });
```

`Toasts` is exported too, for an app with a layout of its own.

## Pages

A page is a server component made by its `create` function, for a file of `app/`.

### Login

`createLoginPage` gives a card in the middle of the screen with its title and subtitle, a button per provider, the email and the password, and a link that switches the card between signing in and signing up (the email as the name), at Better Auth of the `api` store. The form validates both, and both go to `home` (`/` by default) when the backend answers `success`. While a request of the store is out, the submit button shows its loader and the providers are disabled. The mode is the flag of `AuthController`, at `/auth/isToggled` of `app`. With a session the page goes to `home` at once, without showing the login (`createPage` with `auth: false`).

```tsx
// app/login/page.tsx
import { createLoginPage } from '@nano-app/mantine';

export default createLoginPage({ providers: ['google'] });
```

- `providers` adds a button per social provider of Better Auth (`['google']`): it asks `POST /auth/sign-in/social` and goes to the provider's page, which comes back to `home`. Configure the provider in the backend's `auth.socialProviders`, with a `redirectURI` through the proxy of the store (`https://app.example.com/api/api/auth/callback/google`): the provider comes back through it, and the session cookie stays on the app's domain.
- `fields` are the fields of the sign-in, `LOGIN_FIELDS` (email and password, exported) by default, and `signUpFields` those of the sign-up, `fields` by default: `signUpFields: [...LOGIN_FIELDS, { name: 'phone', label: 'users.phone' }]`. A `validation` is a zod schema, which Next cannot send from a server component: a page with its own fields starts with `'use client'`. Their values go to Better Auth as they are; it keeps a field beyond `email`, `password` and `name` only when the backend declares it in `auth.user.additionalFields`.
- `signUp: false` hides the link to sign up, for an app where only an admin creates users. Turn off the sign-up of each social provider in the backend too (`disableSignUp: true`), so a provider only signs in users that exist.
- Its texts are the keys `nano.login.*` of the app's texts (see [Texts](../frontend/README.md#texts)): `title`, `subtitle`, `divider`, `noAccount`, `haveAccount`, `email`, `password`, `submit`, `register`, `invalidEmail`, `required` and `google`, in English and Spanish by default; an app replaces them, or gives other locales, in `src/i18n/<locale>.i18n.ts`.
- The form keeps its state at `/form/login` of `app`. A page that needs the session uses `createPage` of `@nano-app/frontend/server`.

### Not found

`createNotFoundPage` gives the 404: a faint 404 behind a title, a description and a button to `home` (`/` by default), in a narrow column in the middle of the screen.

```tsx
// app/not-found.tsx
import { createNotFoundPage } from '@nano-app/mantine';

export default createNotFoundPage({});
```

- In `app/`, outside the groups' layouts, it takes every URL that matches no page, with a session or without one.
- Its texts are the keys `nano.notFound.*`: `title`, `description` and `home`, in English and Spanish by default.

## Layout of the package

```
mantine/src/
├── index.ts                         the import path: exports every piece and its types
├── layout/index.tsx                 createLayout: the root layout
├── layout/shell/                    createShell: the layout of the pages with a session, its const.ts beside it
├── components/<type>/               views of @nano-app/controllers, grouped by type
│   ├── index.ts                     exports each view of the type
│   ├── <View>.tsx                   a view alone (fields/Input.tsx)
│   └── <View>/                      a view with pieces of its own
│       ├── <View>.tsx
│       └── components/              the pieces only that view uses
├── pages/<name>/                    a ready page, the same folder as a view
│   ├── index.tsx                    create<Name>Page, the server page
│   ├── <Name>.tsx
│   └── components/
├── types/                           the options and the types of each piece
└── const.ts                         the defaults several views share; a view's own go in a const.ts beside it
```

# @nano-app/mantine

[![mantine](https://img.shields.io/npm/v/@nano-app/mantine?label=mantine)](https://www.npmjs.com/package/@nano-app/mantine)

[Mantine](https://mantine.dev) for [`@nano-app/frontend`](https://www.npmjs.com/package/@nano-app/frontend): the root layout, the views of [`@nano-app/controllers`](https://www.npmjs.com/package/@nano-app/controllers) and ready pages. Every piece leaves from one import: `import { createLayout, createLoginPage, Input } from '@nano-app/mantine'`. Each client view keeps its `'use client'`, so a server page and a client component import from the same place.

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.
- `@mantine/core`, `@mantine/hooks` and `@mantine/notifications` 9, `@nano-app/frontend` 0.16, `@nano-app/controllers` 0.13, Next 16.3 and React 19 or newer, as peer dependencies.

```bash
pnpm add @nano-app/mantine @nano-app/frontend @nano-app/controllers @mantine/core @mantine/hooks @mantine/notifications
```

## Layout

`createLayout` gives the root layout: the `<html>` of its language with Mantine's attributes, the script of the color scheme in `<head>`, Mantine's styles, `MantineProvider`, `NanoAppProvider` and the errors (see [Errors](#errors)).

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
  - `lang`: the language of the html.
  - `colorScheme`: `light`, `dark` or `auto` (by default: the system's), until the user picks one. It reaches `MantineProvider` and the script of the `<head>` alike, so the first render has the right colors.
  - `provider`: the props of `MantineProvider` (`theme`…), as they are.
  - `notifications`: the props of Mantine's `Notifications` (see [Notifications](#notifications)), as they are.
- The layout is a server component and `MantineProvider` a client one: a prop that holds a function (a theme with `Button.extend`, `styles` or `vars` as functions, a `colorSchemeManager`) fails on the server. Start `theme.ts` with `'use client'`, as above: then any theme works.
- The page's `<head>` comes from Next: `metadata` in the layout or in each page, and an app installable on a phone from `app/manifest.ts` and the icons `app/icon.png` and `app/apple-icon.png`, which Next links by itself.

## Components

Views of `@nano-app/controllers`, with Mantine. Their logic is the controller's: see [its README](../controllers/README.md).

| Component  | Import                                         | Controller        | Props                                    |
| ---------- | ---------------------------------------------- | ----------------- | ---------------------------------------- |
| `Input`    | `import { Input } from '@nano-app/mantine'`    | `FieldController` | `form`, `field` (`label`, `type`)        |
| `Password` | `import { Password } from '@nano-app/mantine'` | `FieldController` | `form`, `field` (`label`)                |
| `Form`     | `import { Form } from '@nano-app/mantine'`     | `FormController`  | `name`, `fields`, `onSubmit`, `children` |

`Input` is a `TextInput` with the field's `label` and `type`, its value and its error. `Password` is a `PasswordInput`, with a toggle that shows the password. `Form` shows each `password` field with `Password`, every other one with `Input`, and then its `children`, the buttons:

```tsx
<Form
  name="note"
  fields={[{ name: 'title', label: 'Title', validation: z.string() }]}
  onSubmit={notes.add}
>
  <Button type="submit">Save</Button>
</Form>
```

## Notifications

`createLayout` mounts `Toasts`, Mantine's `Notifications` with the messages of the backend among them: every new message of an api store (its `/message/list`, see [`MessageController`](../controllers/README.md#message)) shows as a toast of its `type` (the backend's, or `success` or `error` by its result) in its color: `success` green, `error` red, `info` blue, `warning` yellow, and its list is emptied. An app does nothing to show what the backend answers.

`notifications` of `createLayout` takes the props of Mantine's `Notifications`: `position` (`top-right` by default), `autoClose` (3000 ms by default, `false` to keep them until closed), `limit`…

```tsx
createLayout({ lang: 'es', notifications: { position: 'bottom-right', autoClose: 5000 } });
```

`Toasts` is exported too, for an app with a layout of its own.

## Pages

A page is a server component made by its `create` function, for a file of `app/`.

### Login

`createLoginPage` gives a card in the middle of the screen with its title and subtitle, a button per provider, the email and the password, and a link that switches the card between signing in and signing up (the email as the name), at Better Auth of the `api` store. The form validates both, and both go to `home` when the backend answers `success`. While a request of the store is out, the submit button shows its loader and the providers are disabled. The mode is kept at `/auth/isSignUp` of `app`.

```tsx
// app/login/page.tsx
import { createLoginPage } from '@nano-app/mantine';

export default createLoginPage({
  home: '/',
  texts: { title: 'finance', submit: 'Ingresar' },
});
```

- `providers` adds a button per social provider of Better Auth (`['google']`): it asks `POST /auth/sign-in/social` and goes to the provider's page, which comes back to `home`. Configure the provider in the backend's `auth.socialProviders`, with a `redirectURI` through the proxy of the store (`https://app.example.com/api/api/auth/callback/google`): the provider comes back through it, and the session cookie stays on the app's domain.
- `signUp: false` hides the link to sign up, for an app where only an admin creates users. Turn off the sign-up of each social provider in the backend too (`disableSignUp: true`), so a provider only signs in users that exist.
- `texts` replaces the English texts: `title`, `subtitle`, `divider`, `noAccount`, `haveAccount`, `email`, `password`, `submit`, `register`, `invalidEmail`, `required` and `google`.
- The form keeps its state at `/form/login` of `app`. A page that needs the session uses `createPage` of `@nano-app/frontend/server`.

## Layout of the package

```
mantine/src/
├── index.ts                         the import path: exports every piece and its types
├── layout/index.tsx                 createLayout: the root layout
├── components/<type>/               views of @nano-app/controllers, grouped by type
│   ├── index.ts                     exports each view of the type
│   ├── <View>.tsx                   a view alone (fields/Input.tsx)
│   └── <View>/                      a view with pieces of its own
│       ├── <View>.tsx
│       └── components/              the pieces only that view uses
├── pages/<name>/                    a ready page, the same folder as a view
│   ├── index.tsx                    create<Name>Page, the server page, and its English texts
│   ├── <Name>.tsx
│   └── components/
├── types/                           the options and the types of each piece
└── const.ts                         the defaults shared by the views
```

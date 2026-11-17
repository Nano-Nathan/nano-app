# @nano-app/mantine

[![mantine](https://img.shields.io/npm/v/@nano-app/mantine?label=mantine)](https://www.npmjs.com/package/@nano-app/mantine)

[Mantine](https://mantine.dev) for [`@nano-app/frontend`](https://www.npmjs.com/package/@nano-app/frontend): the root layout, the views of [`@nano-app/components`](https://www.npmjs.com/package/@nano-app/components) and ready pages. One import path per piece: `@nano-app/mantine/layout`, `@nano-app/mantine/components/<name>`, `@nano-app/mantine/pages/<name>`.

- Node.js 22.23.4, 24.22.1 or 26.12.1 and newer. ESM only.
- `@mantine/core` and `@mantine/hooks` 9, `@nano-app/frontend` 0.16, `@nano-app/components` 0.13, Next 16.3 and React 19 or newer, as peer dependencies.

```bash
pnpm add @nano-app/mantine @nano-app/frontend @nano-app/components @mantine/core @mantine/hooks
```

## Layout

`createLayout` gives the root layout: the `<html>` of its language with Mantine's attributes, the script of the color scheme in `<head>`, Mantine's styles, `MantineProvider` and `NanoAppProvider`.

```tsx
// app/layout.tsx
import createLayout from '@nano-app/mantine/layout';
import theme from '@/theme';

export const metadata = { title: 'finance' };

export default createLayout({ lang: 'es', theme, defaultColorScheme: 'auto' });
```

```ts
// src/theme.ts
'use client';

import { createTheme } from '@mantine/core';

export default createTheme({ primaryColor: 'teal' });
```

- `lang` is the language of the html; every other option is a prop of `MantineProvider` (`theme`, `defaultColorScheme`, `forceColorScheme`…), and `defaultColorScheme` and `forceColorScheme` also reach the script.
- The layout is a server component and `MantineProvider` a client one: a prop that holds a function (a theme with `Button.extend`, `styles` or `vars` as functions, a `colorSchemeManager`) fails on the server. Start `theme.ts` with `'use client'`, as above: then any theme works.
- The page's `<head>` comes from Next: `metadata` in the layout or in each page, and an app installable on a phone from `app/manifest.ts` and the icons `app/icon.png` and `app/apple-icon.png`, which Next links by itself.

## Components

Views of `@nano-app/components`, with Mantine. Their logic is the component's: see [its README](../components/README.md).

| Component | Import                                                   | Controller        | Props                                    |
| --------- | -------------------------------------------------------- | ----------------- | ---------------------------------------- |
| `Input`   | `import Input from '@nano-app/mantine/components/input'` | `FieldController` | `form`, `field` (`label`, `type`)        |
| `Form`    | `import Form from '@nano-app/mantine/components/form'`   | `FormController`  | `name`, `fields`, `onSubmit`, `children` |

`Input` is a `TextInput` with the field's `label` and `type`, its value and its error. `Form` shows every field with `Input` and then its `children`, the buttons:

```tsx
<Form
  name="note"
  fields={[{ name: 'title', label: 'Title', validation: z.string() }]}
  onSubmit={notes.add}
>
  <Button type="submit">Save</Button>
</Form>
```

## Pages

A page is a server component made by its `create` function, for a file of `app/`.

### Login

`createLoginPage` gives a card in the middle of the screen with the email and the password, a button that signs in and one that signs up with the same values (the email as the name), at Better Auth of the api store `store`. Both go to `home` when the backend answers `success`.

```tsx
// app/login/page.tsx
import createLoginPage from '@nano-app/mantine/pages/login';

export default createLoginPage({
  store: 'api',
  home: '/',
  texts: { title: 'finance', submit: 'Ingresar' },
});
```

- `store` is the name of an api store of the app (`src/stores/api.store.ts`): the page fails when the app has none of that name.
- `texts` replaces the English texts: `title`, `email`, `password`, `submit`, `register`, `invalidEmail` and `required`.
- The form keeps its state at `/form/login` of `app`. A page that needs the session uses `createPage` of `@nano-app/frontend/server`.

## Layout of the package

```
mantine/
├── layout/index.tsx          createLayout: the root layout
├── components/<name>/index.tsx  a view of @nano-app/components
├── pages/<name>/index.tsx    create<Name>Page: a server page, with its client view next to it
└── types/                    the options of each piece
```

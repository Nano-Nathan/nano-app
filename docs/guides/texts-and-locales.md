# Texts and languages

Use this to translate the app, change a text of the framework, or let the user switch language.

## Write the texts of a locale

One file per locale, in `src/i18n/<locale>.i18n.ts` of the frontend. Keys are dotted, on one level:

```ts
// src/i18n/es.i18n.ts
export default {
  'notes.title': 'Título',
  'notes.created': 'Nota creada',
  'nano.login.title': 'Bienvenido',
};
```

- Your keys are yours: name them by screen or feature (`notes.*`).
- A `nano.*` key replaces the framework's text. The framework has English and Spanish.

## Start in a locale

```ts
// src/stores/app.store.ts
export default { type: 'app', data: { locale: 'es' } };
```

Without it the app starts in `en`.

## Show a text

From any controller or view:

```tsx
<Title>{home.text('notes.title')}</Title>
```

A key with no text in the locale shows as `i18n.<key>`, so a missing text is easy to spot.

## Let the user switch

```tsx
<Button onClick={() => view.setLocale('es')}>Español</Button>
```

The views that read a text render again, `<html lang>` follows, and the cookie `nano-locale` keeps the choice for a year. `createLayout` of `@nano-app/mantine` reads that cookie, so the server renders the next page in the same locale.

## Messages of the backend

A backend answer's `message` is a key too. Add it to your texts and the toast shows it translated:

```ts
// backend
return { result: oNote, message: 'notes.created' };
```

**Reference:** [Texts](/reference/frontend#texts).

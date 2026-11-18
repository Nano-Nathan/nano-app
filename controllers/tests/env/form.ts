import { STORES_DEFINE } from '@nano-app/core/const';

// Stores of form.test.tsx, as `withNanoApp` writes them: set before the frontend loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(
    Object.entries({
      app: { type: 'app', data: { i18n: { en: { 'form.required': 'Required' } } } },
    }),
  ),
});

import EN from '@nano-app/core/i18n/en';
import { STORES_DEFINE } from '@nano-app/core/const';

// Stores of the tests, as `withNanoApp` writes them, the framework's English in app: set before the frontend loads
Object.assign(globalThis, {
  [STORES_DEFINE]: JSON.stringify(
    Object.entries({ app: { type: 'app', data: { i18n: { en: EN } } }, api: { type: 'api' } }),
  ),
});

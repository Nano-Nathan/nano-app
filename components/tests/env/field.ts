import { STORES_ENV } from '@nano-app/core/const';

// Stores of field.test.tsx, as `withNanoApp` inlines them: set before the frontend loads
process.env[STORES_ENV] = JSON.stringify({});

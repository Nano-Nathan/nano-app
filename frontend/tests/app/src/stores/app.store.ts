import type { StoreFile } from '@nano-app/frontend';

/** UI state of the test app */
export default {
  type: 'app',
  data: { counter: 0 },
} satisfies StoreFile;

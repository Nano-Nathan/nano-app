import type { StoreFiles } from '../types/store';

/** Store files that `withNanoApp` inlined at build time */
export default function readStoreFiles(): StoreFiles {
  // `process.env.NANO_APP_STORES` stays literal so Next can replace it
  return JSON.parse(process.env.NANO_APP_STORES ?? '{}');
}

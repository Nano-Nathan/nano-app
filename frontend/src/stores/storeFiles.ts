import type { StoreFiles } from '../types/store';

/** Store files that `withNanoApp` inlined at build time, read once when the app loads */
// `process.env.NANO_APP_STORES` stays literal so Next can replace it
const STORE_FILES: StoreFiles = JSON.parse(process.env.NANO_APP_STORES ?? '{}');

export default STORE_FILES;

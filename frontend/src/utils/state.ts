import type { StoreFile, StoreFiles } from '../types/store';

/** Store files that `withNanoApp` inlined at build time */
// `process.env.NANO_APP_STORES` stays literal so Next can replace it
const FILES: StoreFiles = JSON.parse(process.env.NANO_APP_STORES ?? '{}');

/** Stores of the app by name, as their files export them */
export const STORES = new Map<string, StoreFile>(Object.entries(FILES));

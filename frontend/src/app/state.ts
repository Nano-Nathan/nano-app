import type { StoreFile } from '../types/store';

/** Stores of the app as JSON `[name, file]` pairs, written in the bundle by `withNanoApp` */
// `NANO_APP_STORES` stays literal so Next can replace it
declare const NANO_APP_STORES: string;

/** Store files as their `[name, file]` pairs */
const FILES: [string, StoreFile][] = JSON.parse(NANO_APP_STORES);

/** Stores of the app by name, as their files export them */
export const STORES = new Map(FILES);

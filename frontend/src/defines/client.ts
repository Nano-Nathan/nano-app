import type { StoreFile } from '../types/store';

// Values `withNanoApp` writes with `compiler.define`: they reach every bundle, the browser's too.
// Each name stays literal so Next can replace it

/** Each store's name and file as JSON */
declare const NANO_APP_STORES: string;

/** Each store's name and file, the `app` store always among them */
export const STORES: [string, StoreFile][] = JSON.parse(NANO_APP_STORES);

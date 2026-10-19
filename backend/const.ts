import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Folder of the framework: the package root from the sources, `build/` once built. */
export const BASE_DIR = dirname(fileURLToPath(import.meta.url));

/** Error when the database URL is missing, at startup and on `nano-app push` */
export const MISSING_DATABASE_URL =
  '[nano-app] [ERROR] The DATABASE_URL environment variable is not defined.';

/** Gets a directory relative to the base directory */
export const getDir = (...aParts: string[]): string => resolve(BASE_DIR, ...aParts);

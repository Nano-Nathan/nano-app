import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Folder of the framework: the package root from the sources, `build/` once built. */
export const BASE_DIR = dirname(fileURLToPath(import.meta.url));

/** Gets a directory relative to the base directory */
export const getDir = (...aParts: string[]): string => resolve(BASE_DIR, ...aParts);

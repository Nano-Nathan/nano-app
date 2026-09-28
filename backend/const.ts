import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

/** Folder of the framework: the package root from the sources, `build/` once built. */
export const BASE_DIR = dirname(fileURLToPath(import.meta.url));

/** Gets a directory relative to the base directory */
export const getDir = (...parts: string[]) => resolve(BASE_DIR, ...parts);

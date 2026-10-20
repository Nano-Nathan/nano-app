import type { StoreFile, StoreFiles } from '../types/store';

/** Finds and validates the app's `*.store.ts` */
export default abstract class StoreLoader {
  private static oFiles?: StoreFiles;

  /** The app's `*.store.ts` under `src/`, found at build time, valid ones only. Validated once */
  public static load(): StoreFiles {
    // Returns the files already validated
    if (StoreLoader.oFiles) return StoreLoader.oFiles;

    // The pattern is a literal: Turbopack resolves it at build time, from the app's root
    const oModules = import.meta.glob<{ default?: unknown }>('/src/**/*.store.ts', { eager: true });

    // Reads the default export of each file (the keys of the glob are not enumerable)
    const aFiles = Object.getOwnPropertyNames(oModules);
    const oEntries = Object.fromEntries(aFiles.map(sFile => [sFile, oModules[sFile].default]));

    StoreLoader.oFiles = StoreLoader.validate(oEntries);
    return StoreLoader.oFiles;
  }

  /** Valid store files by name (`/src/stores/app.store.ts` → `app`); the rest are warned about and skipped */
  public static validate(oEntries: Record<string, unknown>): StoreFiles {
    const oFiles: StoreFiles = {};

    for (const [sFile, oEntry] of Object.entries(oEntries)) {
      // Names the store after its file
      const sName = sFile
        .split('/')
        .pop()!
        .replace(/\.store\.ts$/, '');

      // Skips an invalid file, or one whose name is taken
      const sTaken = oFiles[sName]
        ? `another file already defines the store "${sName}"`
        : undefined;
      const sProblem = StoreLoader.problem(oEntry) ?? sTaken;
      if (sProblem) {
        console.warn(`[nano-app] [WARNING] ${sFile}: ${sProblem}. The store is skipped.`);
        continue;
      }

      oFiles[sName] = oEntry as StoreFile;
    }

    return oFiles;
  }

  /** What is wrong with the default export of a store file, if anything */
  private static problem(oEntry: unknown): string | undefined {
    // Checks that the default export is an app store object
    const oFile = oEntry as { type?: unknown } | null;
    if (!oFile || typeof oFile !== 'object') return 'its default export is not an object';
    if (oFile.type !== 'app') return 'its type must be "app"';

    return undefined;
  }
}

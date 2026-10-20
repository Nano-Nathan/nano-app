import Modules from '@nano-app/core/loader/Modules';
import type { StoreFile, StoreFiles } from '../types/store';

/** Finds and validates the app's `*.store.ts` */
export default abstract class StoreLoader {
  private static oFiles?: StoreFiles;

  /** The app's `*.store.ts` under `src/stores/` (subfolders too), found at build time, valid ones only. Validated once */
  public static load(): StoreFiles {
    // Returns the files already validated
    if (StoreLoader.oFiles) return StoreLoader.oFiles;

    // The pattern is a literal: Turbopack resolves it at build time, from the app's root
    const oModules = import.meta.glob<{ default?: unknown }>('/src/stores/**/*.store.ts', {
      eager: true,
    });

    // Reads the default export of each file (the keys of the glob are not enumerable)
    const aFiles = Object.getOwnPropertyNames(oModules);
    const oEntries = Object.fromEntries(aFiles.map(sFile => [sFile, oModules[sFile].default]));

    StoreLoader.oFiles = StoreLoader.validate(oEntries);
    return StoreLoader.oFiles;
  }

  /** Valid store files by their path under `src/stores/`, with `_` for `/` (`/src/stores/admin/users.store.ts` → `admin_users`) */
  public static validate(oEntries: Record<string, unknown>): StoreFiles {
    const oValid = Modules.validate<StoreFile>(oEntries, 'store', '/src/stores/');

    // admin/users.store.ts and admin_users.store.ts share a name: the first one wins
    const oFiles: StoreFiles = {};
    for (const [sPath, oFile] of Object.entries(oValid)) {
      const sName = sPath.replaceAll('/', '_');
      if (oFiles[sName]) {
        console.warn(
          `[nano-app] [WARNING] /src/stores/${sPath}.store.ts: the name "${sName}" is taken.`,
        );
        continue;
      }
      oFiles[sName] = oFile;
    }

    return oFiles;
  }
}

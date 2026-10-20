import Validator from './Validator';
import type { NanoObject } from '../types/objects';
import type { FindableExtension } from '../types/loader';

/** Keys and validates modules already loaded. No Node dependencies: the frontend imports it too */
export default abstract class Modules {
  /**
   * Keys each module by its path under `sSrcDir`, without the extension
   * (`src/routes/a/b.route.ts` → `/a/b`), and drops the invalid ones
   */
  public static validate<T>(
    oModules: NanoObject,
    sExtension: FindableExtension,
    sSrcDir: string,
  ): NanoObject<T> {
    const oEntries: NanoObject = {};
    for (const [sFilePath, oModule] of Object.entries(oModules)) {
      const sFileSubPath = sFilePath
        .slice(sSrcDir.length)
        .replace(new RegExp(`\\.${sExtension}\\.(ts|js)$`), '');
      oEntries[sFileSubPath] = oModule;
    }

    // Drops invalid entries (one invalid file does not discard the rest)
    return Validator.validate<T>(oEntries, sExtension);
  }
}

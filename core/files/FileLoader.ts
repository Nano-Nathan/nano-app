import { glob } from 'glob';
import FileReader from './FileReader';
import type { NanoObject } from '../types/objects';
import type { FindableExtension } from '../types/files';

/** Finds and loads the consumer's files */
export default abstract class FileLoader {
  /** Finds `*.<extension>.ts` (or built `.js`) files in a folder (`src/<extension>s` by default) and returns `{ [subPath]: defaultExport }` */
  public static async findMany(
    sExtension: FindableExtension,
    sSourceDir?: string,
  ): Promise<NanoObject> {
    // Resolves the paths
    const sSrcDir = (sSourceDir ?? `src/${sExtension}s`).replace(/^\.\//, '').replace(/\/$/, '');
    const aFilePaths = await glob(`${sSrcDir}/**/*.${sExtension}.{ts,js}`, {
      posix: true,
      ignore: '**/*.d.ts',
    });

    // Loads each file, keyed by its path without the extension (`src/routes/a/b.route.ts` → `/a/b`)
    const oEntries: NanoObject = {};
    for (const sFilePath of aFilePaths) {
      const sFileSubPath = sFilePath
        .slice(sSrcDir.length)
        .replace(new RegExp(`\\.${sExtension}\\.(ts|js)$`), '');
      // Stores use `_` for `/` (`src/stores/admin/users.store.ts` → `admin_users`)
      const sKey =
        sExtension === 'store' ? sFileSubPath.slice(1).replaceAll('/', '_') : sFileSubPath;
      oEntries[sKey] = await FileReader.loadModule(sFilePath, { default: true });
    }

    return oEntries;
  }
}

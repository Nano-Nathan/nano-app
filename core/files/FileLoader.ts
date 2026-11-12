import { glob } from 'glob';
import FileReader from './FileReader';
import Validator from '../utils/Validator';
import type { NanoObject } from '../types/objects';
import type { FileEntries, FindableExtension } from '../types/files';

/** Finds and loads the consumer's files */
export default abstract class FileLoader {
  /** Finds and validates the `*.<extension>.ts` files of a folder: `{ [subPath]: defaultExport }` */
  public static async findMany<E extends FindableExtension>(
    sExtension: E,
    sSourceDir?: string,
  ): Promise<NanoObject<FileEntries[E]>> {
    // Resolves the paths
    const sSrcDir = (sSourceDir ?? `src/${sExtension}s`).replace(/^\.\//, '').replace(/\/$/, '');
    const aFilePaths = await glob(`${sSrcDir}/**/*.${sExtension}.{ts,js}`, {
      posix: true,
      ignore: '**/*.d.ts',
    });

    // Loads and validates each file, keyed by its path without the extension
    const oEntries: NanoObject<FileEntries[E]> = {};
    for (const sFilePath of aFilePaths) {
      const sFileSubPath = sFilePath
        .slice(sSrcDir.length)
        .replace(new RegExp(`\\.${sExtension}\\.(ts|js)$`), '');
      // Stores use `_` for `/` (`src/stores/admin/users.store.ts` → `admin_users`)
      const sKey =
        sExtension === 'store' ? sFileSubPath.slice(1).replaceAll('/', '_') : sFileSubPath;
      const oFile = await FileReader.loadModule(sFilePath, { default: true });
      oEntries[sKey] = Validator.validate(sExtension, oFile, sKey);
    }

    return oEntries;
  }
}

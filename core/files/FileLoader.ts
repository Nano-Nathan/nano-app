import { glob } from 'glob';
import FileReader from './FileReader';
import Validator from '../utils/Validator';
import type { z } from 'zod';
import type { NanoObject } from '../types/objects';

/** Finds and loads the consumer's files */
export default abstract class FileLoader {
  /** The `*.<extension>.ts` files of a folder by subpath, checked with a schema */
  public static async findMany<T>(
    sExtension: string,
    oSchema: z.ZodType<T>,
    sSourceDir?: string,
  ): Promise<NanoObject<T>> {
    // Resolves the paths
    const sSrcDir = (sSourceDir ?? `src/${sExtension}s`).replace(/^\.\//, '').replace(/\/$/, '');
    const aFilePaths = await glob(`${sSrcDir}/**/*.${sExtension}.{ts,js}`, {
      posix: true,
      ignore: '**/*.d.ts',
    });

    // Loads and validates each file, keyed by its path without the extension
    const oEntries: NanoObject<T> = {};
    for (const sFilePath of aFilePaths) {
      const sKey = sFilePath
        .slice(sSrcDir.length)
        .replace(new RegExp(`\\.${sExtension}\\.(ts|js)$`), '');
      const oFile = await FileReader.loadModule(sFilePath, { default: true });
      oEntries[sKey] = Validator.validate(oSchema, oFile, sKey);
    }

    return oEntries;
  }
}

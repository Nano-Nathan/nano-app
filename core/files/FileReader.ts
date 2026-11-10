import { isAbsolute, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createJiti } from 'jiti';
import NanoError from '../utils/NanoError';
import type { JitiResolveOptions } from 'jiti';

/** Reads and loads files from disk, resolved from `cwd` */
export default abstract class FileReader {
  /** Loader of the consumer's modules */
  private static oJiti = createJiti(import.meta.url);

  /** Loads a module via jiti */
  public static async loadModule<T = unknown>(
    sFilePath: string,
    oOptions: JitiResolveOptions & { default?: true } = {},
  ): Promise<T> {
    return await this.oJiti.import<T>(this.getAbsolutePath(sFilePath), oOptions);
  }

  /** Resolves the absolute path of a file */
  public static getAbsolutePath(sFilePath: string): string {
    // Resolves the absolute path
    const sAbsolutePath = isAbsolute(sFilePath) ? sFilePath : resolve(process.cwd(), sFilePath);

    // Checks that the file exists
    if (!existsSync(sAbsolutePath)) {
      throw new NanoError(`${sFilePath} not found.`);
    }

    // Returns the absolute path
    return sAbsolutePath;
  }
}

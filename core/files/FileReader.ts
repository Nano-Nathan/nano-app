import { isAbsolute, resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { createJiti } from 'jiti';
import Formatter from '../utils/Formatter';
import type { JitiResolveOptions } from 'jiti';

/** Reads and loads files from disk, resolved from `cwd` */
export default abstract class FileReader {
  /** Loader of the consumer's modules; the Prisma runtime is loaded natively */
  private static oJiti = createJiti(import.meta.url, { nativeModules: ['@prisma/client'] });

  /** Loads a module via jiti */
  public static async loadModule<T = unknown>(
    sFilePath: string,
    oOptions: JitiResolveOptions & { default?: true } = {},
  ): Promise<T> {
    return await this.oJiti.import<T>(this.getAbsolutePath(sFilePath), oOptions);
  }

  /** Reads the contents of a file */
  public static loadFile(sFilePath: string): string {
    const sContent = readFileSync(this.getAbsolutePath(sFilePath), 'utf-8');

    // Checks that the contents are valid
    if (!sContent) {
      throw new Error(
        Formatter.message('ERROR', `The file ${sFilePath} does not have valid content.`),
      );
    }

    // Returns the contents
    return sContent;
  }

  /** Reads a Prisma schema without its `//` comments */
  public static loadSchema(sFilePath: string): string {
    return this.loadFile(sFilePath).replace(/\/\/.*$/gm, '');
  }

  /** Schemas a Prisma schema declares in its datasource (`schemas = [...]`) */
  public static schemas(sContent: string): string[] {
    const sDeclared =
      sContent.match(/datasource\s+\w+\s*\{[^}]*schemas\s*=\s*\[([^\]]*)\]/s)?.[1] ?? '';
    return [...sDeclared.matchAll(/["']([^"']+)["']/g)].map(([, sItem]) => sItem);
  }

  /** Resolves the absolute path of a file */
  public static getAbsolutePath(sFilePath: string): string {
    // Resolves the absolute path
    const sAbsolutePath = isAbsolute(sFilePath) ? sFilePath : resolve(process.cwd(), sFilePath);

    // Checks that the file exists
    if (!existsSync(sAbsolutePath)) {
      throw new Error(Formatter.message('ERROR', `${sFilePath} not found.`));
    }

    // Returns the absolute path
    return sAbsolutePath;
  }
}

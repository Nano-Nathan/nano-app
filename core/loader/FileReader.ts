import { createJiti, JitiResolveOptions } from 'jiti';
import { isAbsolute, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

export default abstract class FileReader {
  // The Prisma runtime is loaded natively: through jiti its interop breaks the error messages
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
      throw new Error(`[nano-app] [ERROR] The file ${sFilePath} does not have valid content.`);
    }

    // Returns the contents
    return sContent;
  }

  /** Resolves the absolute path of a file */
  public static getAbsolutePath(sFilePath: string): string {
    // Resolves the absolute path
    const sAbsolutePath = isAbsolute(sFilePath) ? sFilePath : resolve(process.cwd(), sFilePath);

    // Checks that the file exists
    if (!existsSync(sAbsolutePath)) {
      throw new Error(`[nano-app] [ERROR] ${sFilePath} not found.`);
    }

    // Returns the absolute path
    return sAbsolutePath;
  }
}

import { createJiti, JitiResolveOptions } from "jiti";
import { isAbsolute, resolve } from "path";
import { readFileSync, existsSync } from "fs";

export abstract class FileReader {
  // The Prisma runtime is loaded natively: through jiti its interop breaks the error messages
  private static jiti = createJiti(import.meta.url, { nativeModules: ["@prisma/client"] });

  /** Loads a module via jiti */
  public static async loadModule<T = unknown>(filePath: string, options: JitiResolveOptions & { default?: true } = {}): Promise<T> {
    return await this.jiti.import<T>(
      this.getAbsolutePath(filePath),
      options
    );
  }

  /** Reads the contents of a file */
  public static loadFile(filePath: string): string {
    const content = readFileSync(this.getAbsolutePath(filePath), "utf-8");

    // Checks that the contents are valid
    if (!content) {
      throw new Error(`[nano-app] [ERROR] The file ${filePath} does not have valid content.`);
    }

    // Returns the contents
    return content;
  }

  /** Resolves the absolute path of a file */
  public static getAbsolutePath(filePath: string): string {
    // Resolves the absolute path
    const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);

    // Checks that the file exists
    if (!existsSync(absolutePath)) {
      throw new Error(`[nano-app] [ERROR] ${filePath} not found.`);
    }

    // Returns the absolute path
    return absolutePath;
  }
}

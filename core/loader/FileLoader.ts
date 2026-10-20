import { glob } from 'glob';
import Validator from './Validator';
import FileReader from './FileReader';
import Formatter from '../utils/Formatter';
import type { NanoObject, RouteEntry, PrismaEntry } from '../types/objects';
import type { FindOptions } from '../types/loader';

/** Finds, loads and validates the consumer's files */
export default abstract class FileLoader {
  /**
   * 1. Validates a `.prisma` file.
   * 2. Loads a generated Prisma client module (`client.ts`, or `client.js`)
   */
  public static async findPrismaClient(
    sClientPath: string,
    sSchemaPath: string,
  ): Promise<PrismaEntry> {
    // Reads the schema
    const sContent = FileReader.loadSchema(sSchemaPath);

    // Validates it
    if (!Validator.validateUnique(sContent, 'prisma', sSchemaPath)) {
      throw new Error(`[nano-app] [ERROR] ${sSchemaPath} is not a valid Prisma schema.`);
    }

    // Loads the client
    try {
      return (await FileReader.loadModule<{ PrismaClient: PrismaEntry }>(sClientPath))
        ?.PrismaClient;
    } catch (oError) {
      throw new Error(
        `[nano-app] [ERROR] The Prisma client ${sClientPath} could not be loaded: ${Formatter.error(oError)}`,
      );
    }
  }

  /** Finds `*.route.ts` (or built `.js`) files and returns `{ [subPath]: defaultExport }` */
  public static async findMany<T extends RouteEntry>({
    extension,
    sourceDir,
  }: FindOptions): Promise<NanoObject<T>> {
    // Resolves the paths
    const sSrcDir = (sourceDir ?? `src/${extension}s`).replace(/^\.\//, '').replace(/\/$/, '');
    const aFilePaths = await glob(`${sSrcDir}/**/*.${extension}.{ts,js}`, {
      posix: true,
      ignore: '**/*.d.ts',
    });

    // Loads each file, keyed by its path without the extension (`src/routes/a/b.route.ts` → `/a/b`)
    const oEntries: NanoObject = {};
    for (const sFilePath of aFilePaths) {
      const sFileSubPath = sFilePath
        .slice(sSrcDir.length)
        .replace(new RegExp(`\\.${extension}\\.(ts|js)$`), '');
      // Stores use `_` for `/` (`src/stores/admin/users.store.ts` → `admin_users`)
      const sKey =
        extension === 'store' ? sFileSubPath.slice(1).replaceAll('/', '_') : sFileSubPath;
      oEntries[sKey] = await FileReader.loadModule<T>(sFilePath, { default: true });
    }

    // Drops invalid entries (one invalid file does not discard the rest)
    return Validator.validate<T>(oEntries, extension);
  }
}

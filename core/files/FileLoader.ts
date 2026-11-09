import { glob } from 'glob';
import FileReader from './FileReader';
import Formatter from '../utils/Formatter';
import type { NanoObject, PrismaEntry } from '../types/objects';
import type { FindOptions } from '../types/files';

/** Finds and loads the consumer's files */
export default abstract class FileLoader {
  /** Loads a generated Prisma client module (`client.ts`, or `client.js`) */
  public static async findPrismaClient(sClientPath: string): Promise<PrismaEntry> {
    try {
      return (await FileReader.loadModule<{ PrismaClient: PrismaEntry }>(sClientPath))
        ?.PrismaClient;
    } catch (oError) {
      throw new Error(
        Formatter.message(
          'ERROR',
          `The Prisma client ${sClientPath} could not be loaded: ${Formatter.error(oError)}`,
        ),
      );
    }
  }

  /** Finds `*.route.ts` (or built `.js`) files and returns `{ [subPath]: defaultExport }` */
  public static async findMany({ extension, sourceDir }: FindOptions): Promise<NanoObject> {
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
      oEntries[sKey] = await FileReader.loadModule(sFilePath, { default: true });
    }

    return oEntries;
  }
}

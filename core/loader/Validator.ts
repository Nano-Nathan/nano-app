import type { RouteEntry, StoreEntry, NanoObject } from '../types/objects';
import type { FindableExtension } from '../types/loader';

const HTTP_METHODS: (keyof RouteEntry)[] = ['GET', 'POST', 'PUT', 'DELETE'];

/** Checks the consumer's files: invalid ones are warned about and discarded */
export default abstract class Validator {
  private static oValidators = {
    route: () => this.isRoute,
    store: () => this.isStore,
    prisma: () => this.isPrisma,
  };

  /** Warns about an invalid file and returns `false`, to discard it */
  private static warn(sFilePath: string, sMessage: string): false {
    console.warn(`[nano-app] [WARNING] ${sFilePath}: ${sMessage}`);
    return false;
  }

  /** Checks that the default export is an object */
  private static isObject(oEntry: unknown, sFilePath: string): oEntry is object {
    if (oEntry && typeof oEntry === 'object') return true;
    return Validator.warn(sFilePath, 'the default export is not an object.');
  }

  /**
   * Type guard for a `*.route.ts` entry.
   */
  private static isRoute(oEntry: unknown, sFilePath: string): oEntry is RouteEntry {
    // Checks that the default export is an object
    if (!Validator.isObject(oEntry, sFilePath)) return false;

    // Reads it as a route
    const oRoute = oEntry as RouteEntry;

    // Checks that the expression field is a string
    if (oRoute.expression && typeof oRoute.expression !== 'string')
      return Validator.warn(sFilePath, '"expression" must be a string.');

    // Checks that each HTTP method is a function
    for (const sMethod of HTTP_METHODS) {
      if (oRoute[sMethod] && typeof oRoute[sMethod] !== 'function')
        return Validator.warn(sFilePath, `"${String(sMethod)}" must be a function.`);
    }

    // Checks that the entry defines at least one HTTP method
    if (!HTTP_METHODS.some(sMethod => oRoute[sMethod]))
      return Validator.warn(sFilePath, 'defines no HTTP method.');

    return true;
  }

  /**
   * Type guard for a `*.store.ts` entry.
   */
  private static isStore(oEntry: unknown, sFilePath: string): oEntry is StoreEntry {
    // Checks that the default export is an object
    if (!Validator.isObject(oEntry, sFilePath)) return false;

    // Reads it as a store
    const oStore = oEntry as StoreEntry;

    // Checks that the type field is "app" or "api"
    if (oStore.type !== 'app' && oStore.type !== 'api')
      return Validator.warn(sFilePath, '"type" must be "app" or "api".');

    // Checks that the path field is a string when the type is "api"
    if (oStore.type === 'api' && !oStore.path)
      return Validator.warn(sFilePath, '"path" is required for type "api".');

    return true;
  }

  /**
   * Type guard for a `.prisma` entry: the contents of the file, without comments.
   */
  private static isPrisma(oEntry: unknown, sFilePath: string): oEntry is string {
    // Checks that the entry is the file contents
    if (typeof oEntry !== 'string')
      return Validator.warn(sFilePath, 'the contents are not a string.');

    // Checks that the datasource is PostgreSQL
    const sProvider = oEntry.match(
      /datasource\s+\w+\s*\{[^}]*provider\s*=\s*["']([^"']+)["']/s,
    )?.[1];
    if (sProvider !== 'postgresql') {
      return Validator.warn(
        sFilePath,
        `the datasource provider must be "postgresql"${sProvider ? `, not "${sProvider}"` : ''}.`,
      );
    }

    return true;
  }

  /** Validates a full map of entries and returns only the valid ones */
  public static validate<T>(oEntries: NanoObject, sExtension: FindableExtension): NanoObject<T> {
    // Keeps each entry that passes its validator
    const oValid: NanoObject<T> = {};
    for (const [sFilePath, oEntry] of Object.entries(oEntries)) {
      const oValidated = this.validateUnique<T>(oEntry, sExtension, sFilePath);
      if (oValidated !== undefined) oValid[sFilePath] = oValidated;
    }

    return oValid;
  }

  /** Validates one entry: returns it when valid, `undefined` otherwise */
  public static validateUnique<T>(
    oEntry: T,
    sExtension: FindableExtension,
    sFilePath: string = '',
  ): T | undefined {
    return this.oValidators[sExtension]?.()(oEntry, sFilePath) ? oEntry : undefined;
  }
}

import type { RouteEntry, StoreEntry, NanoObject } from '../types/objects';
import type { FindableExtension } from '../types/loader';

const HTTP_METHODS: (keyof RouteEntry)[] = ['GET', 'POST', 'PUT', 'DELETE'];

export default abstract class Validator {
  private static oValidators = {
    route: () => this.isRoute,
    store: () => this.isStore,
    prisma: () => this.isPrisma,
  };

  /**
   * Type guard for a `*.route.ts` entry.
   */
  private static isRoute(oEntry: unknown, sFilePath: string): oEntry is RouteEntry {
    // Checks that the default export is an object
    if (!oEntry || typeof oEntry !== 'object') {
      console.warn(`[nano-app] [WARNING] ${sFilePath}: the default export is not an object.`);
      return false;
    }

    const oRoute = oEntry as RouteEntry;

    // Checks that the expression field is a string
    if (oRoute.expression && typeof oRoute.expression !== 'string') {
      console.warn(`[nano-app] [WARNING] ${sFilePath}: "expression" must be a string.`);
      return false;
    }

    // Checks that each HTTP method is a function
    for (const sMethod of HTTP_METHODS) {
      if (oRoute[sMethod] && typeof oRoute[sMethod] !== 'function') {
        console.warn(`[nano-app] [WARNING] ${sFilePath}: "${String(sMethod)}" must be a function.`);
        return false;
      }
    }

    // Checks that the entry defines at least one HTTP method
    if (!HTTP_METHODS.some(sMethod => oRoute[sMethod])) {
      console.warn(`[nano-app] [WARNING] ${sFilePath}: no defines any HTTP method.`);
      return false;
    }

    return true;
  }

  /**
   * Type guard for a `*.store.ts` entry.
   */
  private static isStore(oEntry: unknown, sFilePath: string): oEntry is StoreEntry {
    // Checks that the default export is an object
    if (!oEntry || typeof oEntry !== 'object') {
      console.warn(`[nano-app] [WARNING] ${sFilePath}: the default export is not an object.`);
      return false;
    }

    const oStore = oEntry as StoreEntry;

    // Checks that the type field is "app" or "api"
    if (oStore.type !== 'app' && oStore.type !== 'api') {
      console.warn(`[nano-app] [WARNING] ${sFilePath}: "type" must be "app" or "api".`);
      return false;
    }

    // Checks that the path field is a string when the type is "api"
    if (oStore.type === 'api' && !oStore.path) {
      console.warn(`[nano-app] [WARNING] ${sFilePath}: "path" is required for type "api".`);
      return false;
    }

    return true;
  }

  /**
   * Type guard for a `.prisma` entry: the contents of the file, without comments.
   */
  private static isPrisma(oEntry: unknown, sFilePath: string): oEntry is string {
    // Checks that the entry is the file contents
    if (typeof oEntry !== 'string') {
      console.warn(`[nano-app] [WARNING] ${sFilePath}: the contents are not a string.`);
      return false;
    }

    // Checks that the datasource is PostgreSQL
    const sProvider = oEntry.match(
      /datasource\s+\w+\s*\{[^}]*provider\s*=\s*["']([^"']+)["']/s,
    )?.[1];
    if (sProvider !== 'postgresql') {
      console.warn(
        `[nano-app] [WARNING] ${sFilePath}: the datasource provider must be "postgresql"${sProvider ? `, not "${sProvider}"` : ''}.`,
      );
      return false;
    }

    return true;
  }

  /** Validates a full map of entries and returns only the valid ones */
  public static validate<T>(oEntries: NanoObject, sExtension: FindableExtension): NanoObject<T> {
    const oValid: NanoObject<T> = {};

    // Keeps each entry that passes its validator
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

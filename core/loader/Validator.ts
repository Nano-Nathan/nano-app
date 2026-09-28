import type { RouteEntry, StoreEntry, NanoObject } from "../types/objects";
import type { FindableExtension } from "../types/loader";

const HTTP_METHODS: (keyof RouteEntry)[] = ["GET", "POST", "PUT", "DELETE"];

export abstract class Validator {
  private static validators = {
    'route': () => this.isRoute,
    'store': () => this.isStore,
    'prisma': () => this.isPrisma,
  };

  /**
   * Type guard for a `*.route.ts` entry.
   */
  private static isRoute(entry: unknown, filePath: string): entry is RouteEntry {
    // Checks that the default export is an object
    if (!entry || typeof entry !== "object") {
      console.warn(`[nano-app] [WARNING] ${filePath}: the default export is not an object.`);
      return false;
    }

    const route = entry as RouteEntry;

    // Checks that the expression field is a string
    if (route.expression && typeof route.expression !== "string") {
      console.warn(`[nano-app] [WARNING] ${filePath}: "expression" must be a string.`);
      return false;
    }

    // Checks that each HTTP method is a function
    for (const method of HTTP_METHODS) {
      if (route[method] && typeof route[method] !== "function") {
        console.warn(`[nano-app] [WARNING] ${filePath}: "${String(method)}" must be a function.`);
        return false;
      }
    }

    // Checks that the entry defines at least one HTTP method
    if (!HTTP_METHODS.some(method => route[method])) {
      console.warn(`[nano-app] [WARNING] ${filePath}: no defines any HTTP method.`);
      return false;
    }

    return true;
  }

  /**
   * Type guard for a `*.store.ts` entry.
   */
  private static isStore(entry: unknown, filePath: string): entry is StoreEntry {
    // Checks that the default export is an object
    if (!entry || typeof entry !== "object") {
      console.warn(`[nano-app] [WARNING] ${filePath}: the default export is not an object.`);
      return false;
    }

    const store = entry as StoreEntry;

    // Checks that the type field is "app" or "api"
    if (store.type !== "app" && store.type !== "api") {
      console.warn(`[nano-app] [WARNING] ${filePath}: "type" must be "app" or "api".`);
      return false;
    }

    // Checks that the path field is a string when the type is "api"
    if (store.type === "api" && !store.path) {
      console.warn(`[nano-app] [WARNING] ${filePath}: "path" is required for type "api".`);
      return false;
    }

    return true;
  }

  /**
   * Type guard for a `.prisma` entry: the contents of the file, without comments.
   */
  private static isPrisma(entry: unknown, filePath: string): entry is string {
    // Checks that the entry is the file contents
    if (typeof entry !== "string") {
      console.warn(`[nano-app] [WARNING] ${filePath}: the contents are not a string.`);
      return false;
    }

    // Checks that the datasource is PostgreSQL
    const provider = entry.match(/datasource\s+\w+\s*\{[^}]*provider\s*=\s*["']([^"']+)["']/s)?.[1];
    if (provider !== "postgresql") {
      console.warn(`[nano-app] [WARNING] ${filePath}: the datasource provider must be "postgresql"${provider ? `, not "${provider}"` : ""}.`);
      return false;
    }

    return true;
  }

  /** Validates a full map of entries and returns only the valid ones */
  public static validate<T>(entries: NanoObject, extension: FindableExtension): NanoObject<T> {
    const valid: NanoObject<T> = {};

    for (const [filePath, entry] of Object.entries(entries)) {
      const validated = this.validateUnique<T>(entry, extension, filePath);
      if (validated !== undefined) valid[filePath] = validated;
    }

    return valid;
  }

  /** Validates one entry: returns it when valid, `undefined` otherwise */
  public static validateUnique<T>(entry: T, extension: FindableExtension, filePath: string = ""): T | undefined {
    return this.validators[extension]?.()(entry, filePath) ? entry : undefined;
  }
}

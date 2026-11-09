import { API_STORE_TYPE, APP_STORE_TYPE, DEFAULT_REDIRECT, HTTP_METHODS } from '../const';
import FileReader from '../files/FileReader';
import NanoError from './NanoError';
import Paths from './Paths';
import type { RouteEntry, NanoObject } from '../types/objects';

const STORE_TYPES: unknown[] = [APP_STORE_TYPE, API_STORE_TYPE];

/** Checks values of the framework and the consumer's files; an invalid file throws a `NanoError` */
export default abstract class Validator {
  /** Whether a value is a plain object */
  public static isObject(oValue: unknown): oValue is NanoObject {
    return Object.prototype.toString.call(oValue) === '[object Object]';
  }

  /** Whether a value is a plain object of strings */
  public static isStringMap(oValue: unknown): oValue is NanoObject<string> {
    return (
      Validator.isObject(oValue) && Object.values(oValue).every(sItem => typeof sItem === 'string')
    );
  }

  /** Whether a value is a path that starts with `/` */
  public static isPath(oValue: unknown): oValue is string {
    return typeof oValue === 'string' && oValue.startsWith('/');
  }

  /** First environment variable of a list that is not defined */
  public static missingEnv(aNames: string[]): string | undefined {
    return aNames.find(sName => !process.env[sName]);
  }

  /** Checks every entry with a guard (`Validator.isRoute`...): the first invalid one throws */
  public static validate<T>(
    oEntries: NanoObject,
    fnGuard: (oEntry: unknown, sKey: string) => oEntry is T,
  ): NanoObject<T> {
    return Object.fromEntries(
      Object.entries(oEntries).filter(([sKey, oEntry]) => fnGuard(oEntry, sKey)),
    );
  }

  /** Type guard for a `*.route.ts` entry */
  public static isRoute(oEntry: unknown, sFilePath: string): oEntry is RouteEntry {
    // Checks that the default export is an object
    if (!Validator.isObject(oEntry))
      throw new NanoError(`${sFilePath}: the default export is not an object.`);

    // Checks that the expression field is a string
    if (oEntry.expression && typeof oEntry.expression !== 'string')
      throw new NanoError(`${sFilePath}: "expression" must be a string.`);

    // Checks that the public field is a boolean
    if (oEntry.public !== undefined && typeof oEntry.public !== 'boolean')
      throw new NanoError(`${sFilePath}: "public" must be a boolean.`);

    // Checks that each HTTP method is a function, or an object with one as its handler
    for (const sMethod of HTTP_METHODS) {
      const oMethod = oEntry[sMethod];
      if (oMethod && typeof oMethod !== 'function' && typeof oMethod.handler !== 'function')
        throw new NanoError(
          `${sFilePath}: "${sMethod}" must be a function or { handler, permissions }.`,
        );
    }

    // Checks that the entry defines at least one HTTP method
    if (!HTTP_METHODS.some(sMethod => oEntry[sMethod]))
      throw new NanoError(`${sFilePath}: defines no HTTP method.`);

    return true;
  }

  /** Type guard for a `*.store.ts` entry */
  public static isStore(
    oEntry: unknown,
    sFilePath: string,
  ): oEntry is {
    type: typeof APP_STORE_TYPE | typeof API_STORE_TYPE;
    data?: NanoObject;
    headers?: NanoObject<string>;
    auth?: { path: string; routes?: NanoObject[] };
  } {
    // Checks that the default export is an object
    if (!Validator.isObject(oEntry))
      throw new NanoError(`${sFilePath}: the default export is not an object.`);

    // Checks that the type is a known one
    if (!STORE_TYPES.includes(oEntry.type))
      throw new NanoError(
        `${sFilePath}: its type must be "${APP_STORE_TYPE}" or "${API_STORE_TYPE}".`,
      );

    // Checks that the initial state is an object
    if (oEntry.data !== undefined && !Validator.isObject(oEntry.data))
      throw new NanoError(`${sFilePath}: "data" must be an object.`);

    // Checks that the headers name a string (the env var of each value) per header
    if (oEntry.headers !== undefined && !Validator.isStringMap(oEntry.headers))
      throw new NanoError(`${sFilePath}: "headers" must be an object of strings.`);

    // Checks the base path of Better Auth and the routes it guards
    if (oEntry.auth !== undefined && !Validator.isAuth(oEntry.auth))
      throw new NanoError(
        `${sFilePath}: "auth" must be { path, routes }: each route { match, redirect, roles, permissions } with paths starting with /, roles as "admin,user", permissions as { resource: "read,update" }, and a redirect outside its match.`,
      );

    return true;
  }

  /** Whether `auth` has the base path of Better Auth and valid routes, none redirecting to itself */
  private static isAuth(oAuth: unknown): boolean {
    // Checks the base path and that the routes are a list
    if (!Validator.isObject(oAuth) || typeof oAuth.path !== 'string') return false;
    const aRoutes = oAuth.routes ?? [];
    if (!Array.isArray(aRoutes)) return false;

    // Checks each route
    return aRoutes.every(oRoute => {
      if (!Validator.isObject(oRoute)) return false;
      const { match, redirect = DEFAULT_REDIRECT, roles, permissions } = oRoute;
      return (
        Validator.isPath(match) &&
        Validator.isPath(redirect) &&
        !Paths.matches(match, redirect) &&
        (roles === undefined || typeof roles === 'string') &&
        (permissions === undefined || Validator.isStringMap(permissions))
      );
    });
  }

  /** Whether a Prisma schema, without comments, is PostgreSQL and declares the schemas it may */
  public static isPrisma(sContent: string, sFilePath: string, isPlugin: boolean): boolean {
    // Checks that the datasource is PostgreSQL
    const sProvider = sContent.match(
      /datasource\s+\w+\s*\{[^}]*provider\s*=\s*["']([^"']+)["']/s,
    )?.[1];
    if (sProvider !== 'postgresql') {
      throw new NanoError(
        `${sFilePath}: the datasource provider must be "postgresql"${sProvider ? `, not "${sProvider}"` : ''}.`,
      );
    }

    // Checks that an official plugin declares only nano_* schemas, and the others none
    const aSchemas = FileReader.schemas(sContent);
    const isPluginInvalid = !aSchemas.length || aSchemas.some(sItem => !sItem.startsWith('nano_'));
    const isConsumerInvalid = aSchemas.some(sItem => sItem.startsWith('nano_'));
    const isInvalid = isPlugin ? isPluginInvalid : isConsumerInvalid;
    if (isInvalid) {
      const sRule = isPlugin
        ? 'a plugin declares only nano_* schemas'
        : 'the nano_* schemas are reserved for plugins';
      throw new NanoError(`${sFilePath}: ${sRule}.`);
    }

    return true;
  }
}

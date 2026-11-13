import { z } from 'zod';
import { APP_NAME } from '../const';
import NanoError from './NanoError';
import { ROUTE, STORE } from './validations';
import type { DatabaseTable } from '../types/database';
import type { NanoObject } from '../types/objects';
import type { FileEntries, FindableExtension } from '../types/files';

/** The zod schema of each kind of file */
const SCHEMAS: { [E in FindableExtension]: z.ZodType<FileEntries[E]> } = {
  route: ROUTE,
  store: STORE,
};

/** Checks values of the framework and the consumer's files; an invalid file throws a `NanoError` */
export default abstract class Validator {
  /** Whether a value is a plain object */
  public static isObject(oValue: unknown): oValue is NanoObject {
    return Object.prototype.toString.call(oValue) === '[object Object]';
  }

  /** Checks a file with the schema of its kind: an invalid one throws with its key */
  public static validate<E extends FindableExtension>(
    sExtension: E,
    oFile: unknown,
    sKey: string,
  ): FileEntries[E] {
    // Checks the file: zod says what is wrong and where
    const oResult = SCHEMAS[sExtension].safeParse(oFile);
    if (!oResult.success) throw new NanoError(`${sKey}:\n${z.prettifyError(oResult.error)}`);

    return oResult.data;
  }

  /** The nano_* schema reserved for a plugin; the app has none */
  public static reservedSchema(sName: string): string | undefined {
    return sName === APP_NAME ? undefined : `nano_${sName}`;
  }

  /** Checks the tables of a database: a nano_* schema only for the plugin of its name */
  public static checkTables(sName: string, aTables: DatabaseTable[]): void {
    // Fails on a table in the nano_* schema of another plugin
    const sOwn = this.reservedSchema(sName);
    for (const { schema, name } of aTables) {
      if (schema.startsWith('nano_') && schema !== sOwn) {
        throw new NanoError(
          `The database "${sName}": table "${schema}.${name}" breaks the rule, each nano_* schema is reserved for the plugin of its name.`,
        );
      }
    }
  }
}

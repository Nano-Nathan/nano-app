import { z } from 'zod';
import NanoError from './NanoError';
import { ROUTE, STORE } from './validations';
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
}

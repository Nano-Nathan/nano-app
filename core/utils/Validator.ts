import { z } from 'zod';
import NanoError from './NanoError';
import type { NanoObject } from '../types/objects';

/** Checks values of the framework and the consumer's files; an invalid file throws a `NanoError` */
export default abstract class Validator {
  /** Whether a value is a plain object */
  public static isObject(oValue: unknown): oValue is NanoObject {
    return Object.prototype.toString.call(oValue) === '[object Object]';
  }

  /** Checks every entry with a zod schema (`ROUTE`, `STORE`): the first invalid one throws with its key */
  public static validate<T>(oEntries: NanoObject, oSchema: z.ZodType<T>): NanoObject<T> {
    return Object.fromEntries(
      Object.entries(oEntries).map(([sKey, oEntry]) => {
        // Checks the entry: zod says what is wrong and where
        const oResult = oSchema.safeParse(oEntry);
        if (!oResult.success) throw new NanoError(`${sKey}:\n${z.prettifyError(oResult.error)}`);

        return [sKey, oResult.data];
      }),
    );
  }
}

import { z } from 'zod';
import NanoError from './NanoError';

/** Checks the consumer's files; an invalid file throws a `NanoError` */
export default abstract class Validator {
  /** Checks a file with a schema: an invalid one throws with its key */
  public static validate<T>(oSchema: z.ZodType<T>, oFile: unknown, sKey: string): T {
    // Checks the file: zod says what is wrong and where
    const oResult = oSchema.safeParse(oFile);
    if (!oResult.success) throw new NanoError(`${sKey}:\n${z.prettifyError(oResult.error)}`);

    return oResult.data;
  }
}

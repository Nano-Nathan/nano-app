import schema from './schema';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** Rules of a field: its zod schema, then its own rule */
export default abstract class FieldRules {
  /** Message of the first rule the field's value breaks, or `undefined` */
  public static validate(oField: FormField, oValues: NanoObject): string | undefined {
    // The first message of its zod schema, then the one of its own rule
    const oValue = oValues[oField.name];
    const oResult = schema(oField).safeParse(oValue);
    return oResult.error?.issues[0]?.message ?? oField.validate?.(oValue, oValues);
  }
}

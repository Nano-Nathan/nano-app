import type { FormField } from '../types/field';

/** Message of the first rule of a field's validation its value breaks, or `undefined` */
export default function validate(oField: FormField, oValue: unknown): string | undefined {
  return oField.validation?.safeParse(oValue).error?.issues[0].message;
}

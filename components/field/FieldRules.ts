import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** Message of each default rule */
const MESSAGES = { required: 'Required', email: 'Invalid email', number: 'Invalid number' };

/** Rules of a field: the default ones, then its own */
export default abstract class FieldRules {
  /** Message of the first rule the field's value breaks, or `undefined` */
  public static validate(oField: FormField, oValues: NanoObject): string | undefined {
    // Required: a value missing or empty
    const { name, type, required, errorMessage } = oField;
    const oValue = oValues[name];
    const isEmpty = [undefined, null, ''].includes(oValue);
    if (isEmpty && required) return errorMessage ?? MESSAGES.required;
    // Type: an email or a number, when there is a value
    if (!isEmpty && type === 'email' && !/^[^\s@]+@[^\s@]+$/.test(oValue))
      return errorMessage ?? MESSAGES.email;
    if (!isEmpty && type === 'number' && Number.isNaN(Number(oValue)))
      return errorMessage ?? MESSAGES.number;
    // The field's own rule
    return oField.validate?.(oValue, oValues);
  }
}

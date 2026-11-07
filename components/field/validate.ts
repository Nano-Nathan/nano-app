import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/form';

/** Message of each default rule */
const MESSAGES = { required: 'Required', email: 'Invalid email', number: 'Invalid number' };

/** Message of the first rule the field's value breaks, `undefined` when it is valid */
export default function validateField(oField: FormField, oValues: NanoObject): string | undefined {
  const { name, type, required, errorMessage, validate } = oField;
  const oValue = oValues[name];

  // Required: a value missing or empty
  const isEmpty = [undefined, null, ''].includes(oValue);
  if (isEmpty && required) return errorMessage ?? MESSAGES.required;

  // Type: an email or a number, when there is a value
  if (!isEmpty && type === 'email' && !/^[^\s@]+@[^\s@]+$/.test(oValue))
    return errorMessage ?? MESSAGES.email;
  if (!isEmpty && type === 'number' && Number.isNaN(Number(oValue)))
    return errorMessage ?? MESSAGES.number;

  // The field's own rule
  return validate?.(oValue, oValues);
}

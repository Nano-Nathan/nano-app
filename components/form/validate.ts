import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField, FormMessages } from '../types/form';

/** Messages of the default validations */
export const MESSAGES: Required<FormMessages> = {
  required: 'Required',
  email: 'Invalid email',
  number: 'Invalid number',
};

/** Message of the first rule the field's value breaks, `undefined` when it is valid */
export function validateField(
  oField: FormField,
  oValues: NanoObject,
  oMessages: Required<FormMessages>,
): string | undefined {
  const { name, type, required, validate } = oField;
  const oValue = oValues[name];

  // Required: a value missing or empty
  const isEmpty = [undefined, null, ''].includes(oValue);
  if (isEmpty && required) return oMessages.required;

  // Type: an email or a number, when there is a value
  if (!isEmpty && type === 'email' && !/^[^\s@]+@[^\s@]+$/.test(oValue)) return oMessages.email;
  if (!isEmpty && type === 'number' && Number.isNaN(Number(oValue))) return oMessages.number;

  // The field's own rule
  return validate?.(oValue, oValues);
}

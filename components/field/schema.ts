import { z } from 'zod';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** Message of each default rule */
const MESSAGES: NanoObject<string> = {
  required: 'Required',
  email: 'Invalid email',
  number: 'Invalid number',
  value: 'Invalid value',
};

/** Zod constructors by name, and the input types zod does not name */
// any: a field's type and rules pick zod's constructors and methods by name
const ZOD: NanoObject<any> = { ...z, checkbox: z.boolean, date: z.iso.date };

/** Schema of a field: the zod constructor of its type, its rules, and optional unless required */
export default function schema(oField: FormField): z.ZodType {
  // Takes the constructor its type names, or the one of a text
  const { type = 'text', required, errorMessage, rules = {} } = oField;
  const fnType = ZOD[type] ?? z.string;

  // Builds it with the default messages: required when missing, its type's, or invalid
  const oBase = fnType({
    error: (oIssue: z.core.$ZodRawIssue) => {
      if (oIssue.input === undefined) return errorMessage ?? MESSAGES.required;
      const isType = ['invalid_type', 'invalid_format'].includes(oIssue.code ?? '');
      const sTypeMessage = isType ? MESSAGES[type] : undefined;
      return errorMessage ?? sTypeMessage ?? MESSAGES.value;
    },
  });

  // Calls each rule as the zod method of its name, with its value or array of values
  const oRuled = Object.entries(rules).reduce(
    (oSchema, [sRule, oArgs]) => oSchema[sRule](...[oArgs].flat()),
    oBase,
  );

  // Treats an empty text as missing, so only a required field breaks
  const oChecked = required ? oRuled : oRuled.optional();
  return z.preprocess(oValue => (oValue === '' ? undefined : oValue), oChecked);
}

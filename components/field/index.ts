import { createController } from '@nano-app/frontend';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** Message of each default rule */
const MESSAGES = { required: 'Required', email: 'Invalid email', number: 'Invalid number' };

/** Message of the first rule the field's value breaks, `undefined` when it is valid */
function validate(oField: FormField, oValues: NanoObject): string | undefined {
  const { name, type, required, errorMessage } = oField;
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
  return oField.validate?.(oValue, oValues);
}

/** A field of a form: its value and error at `/form/<form>` of the `app` store */
export default function field() {
  return createController(({ props, stores: { app } }) => {
    // Takes the form and the field of its config
    const { form, field: oField } = props;
    const sValues = `/form/${form}/values`;
    const sError = `/form/${form}/errors/${oField.name}`;

    return {
      // The value and the error of the field
      value: () => app.get(`${sValues}/${oField.name}`),
      error: () => app.get(sError),
      change: (oValue: unknown) => {
        // Keeps the value and the message of the first rule it breaks
        app.set(`${sValues}/${oField.name}`, oValue);
        app.set(sError, validate(oField, app.get(sValues)));
      },
    };
  });
}

import { useEffect } from 'react';
import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
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

/** Value to keep of what the view gives `change`: through the field's `parse`, or a number */
function parse(oField: FormField, oInput: unknown): unknown {
  if (oField.parse) return oField.parse(oInput);
  // A number field keeps a number when its text is that number as is
  const iNumber = Number(oInput);
  const isNumber = oField.type === 'number' && String(iNumber) === oInput;
  return isNumber ? iNumber : oInput;
}

/** A field of a form: its value and error at `/form/<form>` of `app`, and its select items */
export default function field() {
  return createController(({ props, stores }) => {
    // Takes the form and the field of its config, and the api store of its options
    const { form, field: oField } = props;
    const { options } = oField;
    const oApi = stores[options?.store ?? API_STORE_TYPE];
    const sValues = `/form/${form}/values`;
    const sValue = `${sValues}/${oField.name}`;
    const sError = `/form/${form}/errors/${oField.name}`;

    // Reads the items of its options from the backend when the view mounts
    useEffect(() => {
      if (options) oApi?.read(options.path);
    }, []);

    return {
      value: () => {
        // The value kept, through the field's format when it has one
        const oValue = stores.app.get(sValue);
        return oField.format ? oField.format(oValue) : oValue;
      },
      error: () => stores.app.get(sError),
      change: (oInput: unknown) => {
        // Keeps the value and the message of the first rule it breaks
        stores.app.set(sValue, parse(oField, oInput));
        stores.app.set(sError, validate(oField, stores.app.get(sValues)));
      },
      // The items kept for the path of its options, as the backend gave them
      options: (): NanoObject[] => (options && oApi?.get(options.path)?.result) ?? [],
    };
  });
}

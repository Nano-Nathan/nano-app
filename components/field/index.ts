import { createController } from '@nano-app/frontend';
import { validateField } from '../form/validate';
import type { Controller } from '@nano-app/frontend';
import type { FieldMethods } from '../types/form';

/** A field of a `form`: its value and error at `/form/<form>/` of the `app` store */
export default function field(): Controller<FieldMethods> {
  return createController(({ props, stores: { app } }) => {
    // Takes the form, the field of its config and the messages the form gives
    const { form, field: oField, messages } = props;
    const sValues = `/form/${form}/values`;
    const sError = `/form/${form}/errors/${oField.name}`;

    return {
      // The value and the error of the field
      value: () => app.get(`${sValues}/${oField.name}`),
      error: () => app.get(sError),
      change: (oValue: unknown) => {
        // Keeps the value and the message of the first rule it breaks
        app.set(`${sValues}/${oField.name}`, oValue);
        app.set(sError, validateField(oField, app.get(sValues), messages));
      },
    };
  });
}

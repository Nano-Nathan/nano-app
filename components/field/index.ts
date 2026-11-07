import { createController } from '@nano-app/frontend';
import validateField from './validate';

/** A field of a form: its value and error at `/form/<form>` of the `app` store */
export default createController(({ props, stores: { app } }) => {
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
      app.set(sError, validateField(oField, app.get(sValues)));
    },
  };
});

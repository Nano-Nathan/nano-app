import { createElement } from 'react';
import { createController } from '@nano-app/frontend';
import { MESSAGES, validateField } from './validate';
import type { FormEvent } from 'react';
import type { Controller } from '@nano-app/frontend';
import type { FormField, FormMethods, FormOptions } from '../types/form';

/** A form made from a config of fields; its values and errors live at `/form/<name>` of the `app` store */
export default function form(oOptions: FormOptions): Controller<FormMethods> {
  const { components, messages } = oOptions;
  const oMessages = { ...MESSAGES, ...messages };

  return createController(({ props, stores: { app } }) => {
    // Takes the name, the fields and the submit of the props
    const { name, fields, onSubmit } = props;
    const sPath = `/form/${name}`;

    return {
      fields: () =>
        fields.map((oField: FormField) => {
          // Takes the view of its type, or the one of text
          const Component = components[oField.type ?? 'text'] ?? components.text;
          if (!Component)
            throw new Error(
              `[nano-app] [ERROR] Form "${name}": the field "${oField.name}" has no component for "${oField.type}" nor "text". Add one to the components of form().`,
            );

          return createElement(Component, {
            key: oField.name,
            form: name,
            field: oField,
            messages: oMessages,
          });
        }),
      submit: async (oEvent: FormEvent) => {
        // Stops the browser's submit
        oEvent.preventDefault();

        // Validates every field and keeps their messages
        const oValues = app.get(`${sPath}/values`) ?? {};
        const oErrors = Object.fromEntries(
          fields.map((oField: FormField) => [
            oField.name,
            validateField(oField, oValues, oMessages),
          ]),
        );
        app.set(`${sPath}/errors`, oErrors);

        // Sends the values only when no field breaks a rule
        if (Object.values(oErrors).some(Boolean)) return;
        await onSubmit(oValues);
      },
      // Empties the values and errors
      reset: () => app.set(sPath, {}),
    };
  });
}

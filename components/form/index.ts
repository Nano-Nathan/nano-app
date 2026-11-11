import { createElement } from 'react';
import { createController } from '@nano-app/frontend';
import NanoError from '@nano-app/core/utils/NanoError';
import validate from '../field/validate';
import type { ReactNode, SubmitEvent } from 'react';
import type { FormField } from '../types/field';
import type { FormOptions } from '../types/form';

/** A form from a config of fields: their views, and their submit at `/form/<name>` of `app` */
export default function form(oOptions: FormOptions) {
  return createController(({ props, stores }) => {
    // Takes the views of the options, the name, fields and submit of the props, and its paths
    const { components } = oOptions;
    const { name, onSubmit } = props;
    const aFields: FormField[] = props.fields;
    const sForm = `/form/${name}`;
    const sValues = `${sForm}/values`;
    const sErrors = `${sForm}/errors`;

    return {
      fields(): ReactNode[] {
        return aFields.map(oField => {
          // Takes the view of its type, or the one of text
          const sType = oField.type ?? 'text';
          const fnView = components[sType] ?? components.text;
          if (!fnView)
            throw new NanoError(
              `Form "${name}": the field "${oField.name}" of type "${sType}" has no view, and components has no "text" view to show it. Add one: form({ components: { text: Input } }).`,
            );

          // Renders it with its form and its config
          return createElement(fnView, { key: oField.name, form: name, field: oField });
        });
      },
      // any: what the onSubmit of the props returns
      submit(oEvent: SubmitEvent<HTMLFormElement>): any {
        // Stops the browser's submit
        oEvent.preventDefault();

        // Validates every field with its value and keeps their messages
        const oValues = stores.app.get(sValues) ?? {};
        const aErrors = aFields.map(oField => [
          oField.name,
          validate(oField, oValues[oField.name]),
        ]);
        stores.app.set(sErrors, Object.fromEntries(aErrors));

        // Sends the values only when no field breaks a rule
        if (aErrors.some(([, sError]) => sError)) return;
        return onSubmit(oValues);
      },
      reset(): void {
        // Empties the values and the errors
        stores.app.set(sForm, {});
      },
    };
  });
}

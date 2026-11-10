import { createElement } from 'react';
import { flattenError } from 'zod';
import { createController } from '@nano-app/frontend';
import NanoError from '@nano-app/core/utils/NanoError';
import type { ReactNode, SubmitEvent } from 'react';
import type { FormField } from '../types/field';
import type { FormOptions, FormSchema } from '../types/form';

/** A form from a config of fields: their views, and their submit at `/form/<name>` of `app` */
export default function form(oOptions: FormOptions) {
  return createController(({ props, stores }) => {
    // Takes the views of the options, the name, fields, schema and submit of the props, and its paths
    const { components } = oOptions;
    const { name, onSubmit } = props;
    const oSchema: FormSchema | undefined = props.schema;
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

          // Renders it with its form, the schema of the form and its config
          return createElement(fnView, {
            key: oField.name,
            form: name,
            schema: oSchema,
            field: oField,
          });
        });
      },
      // any: what the onSubmit of the props returns
      submit(oEvent: SubmitEvent<HTMLFormElement>): any {
        // Stops the browser's submit
        oEvent.preventDefault();

        // Checks the values with the schema of the form and keeps the messages of each field
        const oValues = stores.app.get(sValues) ?? {};
        const oResult = oSchema?.safeParse(oValues);
        stores.app.set(sErrors, oResult?.error ? flattenError(oResult.error).fieldErrors : {});

        // Sends the values only when they break no rule: as zod gives them, or as they are without a schema
        if (oResult?.error) return;
        return onSubmit(oResult?.data ?? oValues);
      },
      reset(): void {
        // Empties the values and the errors
        stores.app.set(sForm, {});
      },
    };
  });
}

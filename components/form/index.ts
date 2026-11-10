import { createElement } from 'react';
import { createController } from '@nano-app/frontend';
import NanoError from '@nano-app/core/utils/NanoError';
import control from './forms';
import type { ReactNode, SubmitEvent } from 'react';
import type { FormField } from '../types/field';
import type { FormOptions } from '../types/form';

/** A form from a config of fields: their views, and their submit at `/form/<name>` of `app` */
export default function form(oOptions: FormOptions) {
  return createController(({ props, stores }) => {
    // Takes the views of the options, and the name, fields and submit of the props
    const { components } = oOptions;
    const { name, onSubmit } = props;
    const aFields: FormField[] = props.fields;

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
      submit(oEvent: SubmitEvent<HTMLFormElement>): Promise<any> {
        // Stops the browser's submit and sends the values only when no field breaks its rules
        return control(stores, name).handleSubmit(onSubmit)(oEvent);
      },
      reset(): void {
        // Empties the values and the errors
        control(stores, name).reset();
      },
    };
  });
}

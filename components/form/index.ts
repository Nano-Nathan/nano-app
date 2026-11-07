import { createElement } from 'react';
import { createController } from '@nano-app/frontend';
import type { ReactNode } from 'react';
import type { FormField } from '../types/field';
import type { FormOptions } from '../types/form';

/** A form made from a config of fields: the view of each field's type */
export default function form(oOptions: FormOptions) {
  return createController(({ props }) => {
    // Takes the views of the options, and the name and fields of the props
    const { components } = oOptions;
    const { name } = props;
    const aFields: FormField[] = props.fields;

    return {
      fields(): ReactNode[] {
        return aFields.map(oField => {
          // Takes the view of its type, or the one of text
          const sType = oField.type ?? 'text';
          const fnView = components[sType] ?? components.text;
          if (!fnView)
            throw new Error(
              `[nano-app] [ERROR] Form "${name}": the field "${oField.name}" of type "${sType}" has no view, and components has no "text" view to show it. Add one: form({ components: { text: Input } }).`,
            );

          // Renders it with its form and its config
          return createElement(fnView, { key: oField.name, form: name, field: oField });
        });
      },
    };
  });
}

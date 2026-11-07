import { createElement } from 'react';
import { createController } from '@nano-app/frontend';
import FieldRules from '../field/FieldRules';
import type { FormEvent, ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';
import type { FormOptions } from '../types/form';

/** A form from a config of fields: their views, and their submit at `/form/<name>` of `app` */
export default function form(oOptions: FormOptions) {
  return createController(({ props, stores }) => {
    // Takes the views of the options, the name and fields of the props, and its paths
    const { components } = oOptions;
    const { name } = props;
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
            throw new Error(
              `[nano-app] [ERROR] Form "${name}": the field "${oField.name}" of type "${sType}" has no view, and components has no "text" view to show it. Add one: form({ components: { text: Input } }).`,
            );

          // Renders it with its form and its config
          return createElement(fnView, { key: oField.name, form: name, field: oField });
        });
      },
      // any: what the onSubmit of the form returns
      submit(oEvent: FormEvent): any {
        // Stops the browser's submit
        oEvent.preventDefault();

        // Validates every field with the values of the form and keeps their messages
        const oValues = stores.app.get(sValues) ?? {};
        const aErrors = aFields.map(oField => [oField.name, FieldRules.validate(oField, oValues)]);
        stores.app.set(sErrors, Object.fromEntries(aErrors));

        // Sends the values only when no field breaks a rule
        if (aErrors.some(([, sError]) => sError)) return;
        return this.onSubmit(oValues);
      },
      // any: what the onSubmit of the form's extend returns
      onSubmit(_oValues: NanoObject): any {
        // Fails with the fix when the form does not define it
        throw new Error(
          `[nano-app] [ERROR] Form "${name}": it has no onSubmit. Add it: form({ components }).extend(() => ({ onSubmit(values) { … } })).`,
        );
      },
      reset(): void {
        // Empties the values and the errors
        stores.app.set(sForm, {});
      },
    };
  });
}

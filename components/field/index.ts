import { flattenError } from 'zod';
import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';
import type { FormSchema } from '../types/form';

/** A field of a form: its value and errors at `/form/<form>` of `app`, and its select items */
export default function field() {
  return createController(({ props, stores }) => {
    // Takes the form, its schema and the field of its config, the api store of its options and its paths
    const { form } = props;
    const oSchema: FormSchema | undefined = props.schema;
    const oField: FormField = props.field;
    const { options } = oField;
    const oApi = options && stores[options.store ?? API_STORE_TYPE];
    const sValues = `/form/${form}/values`;
    const sValue = `${sValues}/${oField.name}`;
    const sError = `/form/${form}/errors/${oField.name}`;

    return {
      // Reads the items of its options from the backend when the view mounts
      callbacks: {
        onMount(): Promise<ApiResponse | undefined> | undefined {
          return options && oApi.read(options.path);
        },
      },
      // any: the value is what the view gave `change`, or what the field's format gives
      value(): any {
        // The value kept, through the field's format when it has one
        const oValue = stores.app.get(sValue);
        return oField.format ? oField.format(oValue) : oValue;
      },
      error(): string | undefined {
        // The first message of the rules it breaks
        return stores.app.get(sError)?.[0];
      },
      change(oInput: unknown): void {
        // Keeps the value, and the messages of the rules of the form's schema it breaks
        stores.app.set(sValue, this.parse(oInput));
        stores.app.set(sError, this.validate(stores.app.get(sValues)));
      },
      parse(oInput: unknown): unknown {
        // The field's own parse; else nothing for an empty text, and a number when a number field's text is one
        if (oField.parse) return oField.parse(oInput);
        if (oInput === '') return undefined;
        const iNumber = Number(oInput);
        const isNumber = oField.type === 'number' && String(iNumber) === oInput;
        return isNumber ? iNumber : oInput;
      },
      validate(oValues: NanoObject): string[] | undefined {
        // The messages zod gives the field for these values of the form
        const oResult = oSchema?.safeParse(oValues);
        return oResult?.error && flattenError(oResult.error).fieldErrors[oField.name];
      },
      options(): NanoObject[] {
        // The items kept for the path of its options, as the backend gave them
        return (options && oApi.get(options.path)?.result) ?? [];
      },
    };
  });
}

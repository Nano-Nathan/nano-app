import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import validate from './validate';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** A field of a form: its value and error at `/form/<form>` of `app`, and its select items */
export default function field() {
  return createController(({ props, stores }) => {
    // Takes the form, the field, its api store and its paths
    const { form } = props;
    const oField: FormField = props.field;
    const { path, store = API_STORE_TYPE } = oField.options ?? {};
    const oApi = path && stores[store];
    const sValue = `/form/${form}/values/${oField.name}`;
    const sError = `/form/${form}/errors/${oField.name}`;

    return {
      // Reads the items of its options from the backend when the view mounts
      callbacks: {
        onMount(): Promise<ApiResponse | undefined> | undefined {
          return oApi?.read(path);
        },
      },
      value(): any {
        // The value kept, through the field's format when it has one
        const oValue = stores.app.get(sValue);
        return oField.format ? oField.format(oValue) : oValue;
      },
      error(): string | undefined {
        return stores.app.get(sError);
      },
      change(oInput: unknown): void {
        // Keeps the value and the message of the first rule it breaks
        const oValue = this.parse(oInput);
        stores.app.set(sValue, oValue);
        stores.app.set(sError, this.validate(oValue));
      },
      parse(oInput: unknown): unknown {
        // Its own parse; else no value for `''`, a number for one
        if (oField.parse) return oField.parse(oInput);
        if (oInput === '') return undefined;
        const iNumber = Number(oInput);
        const isNumber = oField.type === 'number' && String(iNumber) === oInput;
        return isNumber ? iNumber : oInput;
      },
      validate(oValue: unknown): string | undefined {
        // The message of the first rule of its validation the value breaks
        return validate(oField, oValue);
      },
      options(): NanoObject[] {
        // The items kept for the path of its options, as the backend gave them
        return oApi?.get(path)?.result ?? [];
      },
    };
  });
}

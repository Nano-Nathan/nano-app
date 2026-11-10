import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import control from '../form/forms';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** A field of a form: its value and error at `/form/<form>` of `app`, and its select items */
export default function field() {
  return createController(({ props, stores }) => {
    // Takes the form and the field of its config, the api store of its options and its paths
    const { form } = props;
    const oField: FormField = props.field;
    const { options } = oField;
    const oApi = options && stores[options.store ?? API_STORE_TYPE];
    const sValue = `/form/${form}/values/${oField.name}`;
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
        return stores.app.get(sError);
      },
      change(oInput: unknown): void {
        // Keeps the value in its form and validates it with the form's schema
        control(stores, form).setValue(oField.name, this.parse(oInput), { shouldValidate: true });
      },
      parse(oInput: unknown): unknown {
        // The field's own parse, or a number when a number field's text is that number as is
        if (oField.parse) return oField.parse(oInput);
        const iNumber = Number(oInput);
        const isNumber = oField.type === 'number' && String(iNumber) === oInput;
        return isNumber ? iNumber : oInput;
      },
      options(): NanoObject[] {
        // The items kept for the path of its options, as the backend gave them
        return (options && oApi.get(options.path)?.result) ?? [];
      },
    };
  });
}

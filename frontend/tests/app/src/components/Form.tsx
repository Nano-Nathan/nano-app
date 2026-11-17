'use client';

import { createView } from '@nano-app/frontend';
import FormController from '@nano-app/components/form';
import Input from './Input';

/** Form whose every field type is shown with the input */
class InputFormController extends FormController {
  protected components = { text: Input };
}

/** A form of a config of fields, and its button */
export default createView(InputFormController, form => (
  <form noValidate onSubmit={form.submit}>
    {form.fields()}
    <button>sign in</button>
  </form>
));

'use client';

import { Stack } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import FormController from '@nano-app/components/form';
import Input from '../input';

/** Form whose every field type is shown with the input */
class InputFormController extends FormController {
  protected components = { text: Input };
}

/** A form of a config of fields: its inputs, then its children (the buttons) */
export default createView(InputFormController, (form, { children }) => (
  <form noValidate onSubmit={form.submit}>
    <Stack>
      {form.fields()}
      {children}
    </Stack>
  </form>
));

'use client';

import { Stack } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import FormController from '@nano-app/components/form';
import Input from '../input';
import Password from '../password';

/** Form whose passwords show with their own input, every other type with the input */
class InputFormController extends FormController {
  protected components = { text: Input, password: Password };
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

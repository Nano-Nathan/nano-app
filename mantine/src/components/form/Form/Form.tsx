'use client';

import { Stack } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import InputFormController from './Form.controller';

/** A form of a config of fields: its inputs, then its children (the buttons) */
export default createView(InputFormController, (form, { children }) => (
  <form noValidate onSubmit={form.submit}>
    <Stack>
      {form.fields()}
      {children}
    </Stack>
  </form>
));

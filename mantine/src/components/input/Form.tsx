'use client';

import { Stack } from '@mantine/core';
import { FormController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { Input, Password } from '../fields';
import type { ComponentProps } from '@nano-app/frontend';
import type { ReactNode } from 'react';

/** View of each field type: passwords with their own input, every other with the input */
const COMPONENTS = { text: Input, password: Password };

/** The form of a config of fields: its inputs, then its children (the buttons) */
const FormView = createView(FormController, (form, { children }) => (
  <form noValidate onSubmit={form.submit}>
    <Stack>
      {form.fields()}
      {children}
    </Stack>
  </form>
));

/** A form whose fields show with the inputs of Mantine */
export default function Form(props: ComponentProps): ReactNode {
  return <FormView {...props} components={COMPONENTS} />;
}

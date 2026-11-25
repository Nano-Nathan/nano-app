'use client';

import { Stack } from '@mantine/core';
import { FormController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { Calendar, Input, Numeric, Password, Select, Switch } from '../fields';
import type { ComponentProps } from '@nano-app/frontend';
import type { ReactNode } from 'react';

/** View of each field type; the types without one show with the input */
const COMPONENTS = {
  text: Input,
  password: Password,
  number: Numeric,
  select: Select,
  switch: Switch,
  date: Calendar,
};

/** The form of a config of fields: its inputs, then its children (the buttons); its id is its name */
const FormView = createView(FormController, (form, { name, children }) => (
  <form id={name} noValidate onSubmit={form.submit}>
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

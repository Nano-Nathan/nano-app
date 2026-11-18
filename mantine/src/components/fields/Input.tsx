'use client';

import { TextInput } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import { FieldController } from '@nano-app/controllers';

/** A Mantine input of the field's type, with its label and its error */
export default createView(FieldController, (input, { field: oField }) => (
  <TextInput
    label={input.label()}
    radius="md"
    type={oField.type ?? 'text'}
    value={input.value() ?? ''}
    error={input.error()}
    onChange={oEvent => input.change(oEvent.target.value)}
  />
));

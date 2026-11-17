'use client';

import { PasswordInput } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import FieldController from '@nano-app/components/field';

/** A Mantine password input, with a toggle to show it, its label and its error */
export default createView(FieldController, (input, { field: oField }) => (
  <PasswordInput
    label={oField.label}
    radius="md"
    value={input.value() ?? ''}
    error={input.error()}
    onChange={oEvent => input.change(oEvent.target.value)}
  />
));

'use client';

import { PasswordInput } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import { FieldController } from '@nano-app/controllers';

/** A Mantine password input, with a toggle to show it, its label and its error */
export default createView(FieldController, input => (
  <PasswordInput
    label={input.label()}
    placeholder={input.placeholder()}
    value={input.value() ?? ''}
    error={input.error()}
    onChange={oEvent => input.change(oEvent.target.value)}
  />
));

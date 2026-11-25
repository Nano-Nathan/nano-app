'use client';

import { NumberInput } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import { FieldController } from '@nano-app/controllers';

/** A Mantine number input, with its label and its error */
export default createView(FieldController, input => (
  <NumberInput
    label={input.label()}
    radius="md"
    value={input.value() ?? ''}
    error={input.error()}
    onChange={oValue => input.change(oValue)}
  />
));

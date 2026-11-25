'use client';

import { Switch } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import { FieldController } from '@nano-app/controllers';

/** A Mantine switch of a true or false value, with its label and its error */
export default createView(FieldController, input => (
  <Switch
    label={input.label()}
    checked={input.value() ?? false}
    error={input.error()}
    onChange={oEvent => input.change(oEvent.currentTarget.checked)}
  />
));

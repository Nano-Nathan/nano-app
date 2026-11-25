'use client';

import { Select } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import { FieldController } from '@nano-app/controllers';

/** A Mantine select of the field's options, with its label and its error */
export default createView(FieldController, input => (
  <Select
    label={input.label()}
    placeholder={input.placeholder()}
    data={input.options()}
    value={input.value()?.toString() ?? null}
    error={input.error()}
    onChange={sValue => input.change(sValue)}
  />
));

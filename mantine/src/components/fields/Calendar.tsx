'use client';

import { DatePickerInput } from '@mantine/dates';
import { createView } from '@nano-app/frontend';
import { FieldController } from '@nano-app/controllers';

/** A Mantine date input that opens a calendar, with its label and its error; it keeps `YYYY-MM-DD` */
export default createView(FieldController, input => (
  <DatePickerInput
    label={input.label()}
    placeholder={input.placeholder()}
    value={input.value() ?? null}
    error={input.error()}
    onChange={sValue => input.change(sValue)}
  />
));

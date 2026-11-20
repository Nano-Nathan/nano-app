'use client';

import { createView } from '@nano-app/frontend';
import { FieldController } from '@nano-app/controllers';

/** An input of the field's type, with its error */
export default createView(FieldController, (input, { field }) => (
  <label>
    {field.name}
    <input
      type={field.type ?? 'text'}
      value={input.value() ?? ''}
      onChange={oEvent => input.change(oEvent.target.value)}
    />
    <small>{input.error()}</small>
  </label>
));

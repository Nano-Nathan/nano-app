'use client';

import { createView } from '@nano-app/frontend';
import { FieldController } from '@nano-app/controllers';

/** An input of the field's type, with its error */
export default createView(FieldController, (input, { field: oField }) => (
  <label>
    {oField.name}
    <input
      type={oField.type ?? 'text'}
      value={input.value() ?? ''}
      onChange={oEvent => input.change(oEvent.target.value)}
    />
    <small>{input.error()}</small>
  </label>
));

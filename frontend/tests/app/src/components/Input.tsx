'use client';

import field from '@nano-app/components/field';

/** An input of the field's type, with its error */
export default field().bindView(({ props: { field: oField }, value, error, change }) => (
  <label>
    {oField.name}
    <input
      type={oField.type ?? 'text'}
      value={value() ?? ''}
      onChange={oEvent => change(oEvent.target.value)}
    />
    <small>{error()}</small>
  </label>
));

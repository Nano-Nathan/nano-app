'use client';

import field from '@nano-app/components/field';

/** Field of a form: an input of the field's type, with its error */
export default field().bindView(({ props: { field: oField }, value, error, change }) => (
  <label>
    <input
      name={oField.name}
      type={oField.type}
      placeholder={oField.name}
      value={value() ?? ''}
      onChange={oEvent => change(oEvent.target.value)}
    />
    <small>{error()}</small>
  </label>
));

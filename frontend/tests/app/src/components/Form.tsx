'use client';

import form from '@nano-app/components/form';
import Input from './Input';

/** A form of a config of fields, every type shown with the input, and its button */
export default form({ components: { text: Input } }).bindView(({ fields, submit }) => (
  <form noValidate onSubmit={submit}>
    {fields()}
    <button>sign in</button>
  </form>
));

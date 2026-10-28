'use client';

import formController from '../controllers/form.controller';

/** A form of a config of fields, with its button */
export default formController.bindView(({ fields, submit }) => (
  <form noValidate onSubmit={submit}>
    {fields()}
    <button>send</button>
  </form>
));

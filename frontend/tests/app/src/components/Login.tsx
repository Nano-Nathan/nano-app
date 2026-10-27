'use client';

import authController from '../controllers/auth.controller';
import type { FormEvent } from 'react';

/** Sign-in form: goes to the private page once signed in */
export default authController.bindView(({ signIn, navTo }) => {
  // Signs in with the email and password of the form
  const fnSubmit = async (oEvent: FormEvent<HTMLFormElement>) => {
    oEvent.preventDefault();
    const oForm = new FormData(oEvent.currentTarget);
    const oResponse = await signIn({ email: oForm.get('email'), password: oForm.get('password') });
    if (oResponse?.success) navTo('/private');
  };

  return (
    <form onSubmit={fnSubmit}>
      <input name="email" type="email" placeholder="email" />
      <input name="password" type="password" placeholder="password" />
      <button>sign in</button>
    </form>
  );
});

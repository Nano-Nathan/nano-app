'use client';

import authController from '../controllers/auth.controller';
import type { FormEvent } from 'react';

/** Sign-in form: goes to the private page once signed in */
export default authController
  .extend(() => ({
    async submit(oEvent: FormEvent<HTMLFormElement>): Promise<void> {
      // Signs in with the email and password of the form
      oEvent.preventDefault();
      const oForm = new FormData(oEvent.currentTarget);
      const oResponse = await this.signIn({
        email: oForm.get('email'),
        password: oForm.get('password'),
      });

      // Goes to the private page once signed in
      if (oResponse?.success) this.navTo('/private');
    },
  }))
  .bindView(({ submit }) => (
    <form onSubmit={submit}>
      <input name="email" type="email" placeholder="email" />
      <input name="password" type="password" placeholder="password" />
      <button>sign in</button>
    </form>
  ));

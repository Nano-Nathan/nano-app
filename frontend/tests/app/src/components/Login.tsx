'use client';

import authController from '../controllers/auth.controller';
import Form from './Form';

/** Fields of the sign-in */
const LOGIN = [
  { name: 'email', type: 'email', required: true },
  { name: 'password', type: 'password', required: true },
];

/** Sign-in form: goes to the private page once signed in */
export default authController
  .extend(() => ({
    async onSubmit(oValues: unknown): Promise<void> {
      // Signs in with the values of the form
      const oResponse = await this.signIn(oValues);

      // Goes to the private page once signed in
      if (oResponse?.success) this.navTo('/private');
    },
  }))
  .bindView(({ onSubmit }) => <Form name="login" fields={LOGIN} onSubmit={onSubmit} />);

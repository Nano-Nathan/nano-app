'use client';

import { z } from 'zod';
import authController from '../controllers/auth.controller';
import Form from './Form';

/** Fields of the sign-in */
const LOGIN = [
  { name: 'email', type: 'email' },
  { name: 'password', type: 'password' },
];

/** Rules of the sign-in: a valid email and a password */
const LOGIN_SCHEMA = z.object({
  email: z.email('Invalid email'),
  password: z.string('Required').min(1, 'Required'),
});

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
  .bindView(({ onSubmit }) => (
    <Form name="login" fields={LOGIN} schema={LOGIN_SCHEMA} onSubmit={onSubmit} />
  ));

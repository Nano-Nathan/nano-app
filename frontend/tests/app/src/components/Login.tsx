'use client';

import { createView } from '@nano-app/frontend';
import BackendAuthController from '../controllers/auth.controller';
import Form from './Form';

/** Fields of the sign-in */
const LOGIN = [
  { name: 'email', type: 'email', required: true },
  { name: 'password', type: 'password', required: true },
];

/** Sign-in form: goes to the private page once signed in */
export default createView(BackendAuthController, auth => (
  <Form name="login" fields={LOGIN} onSubmit={auth.send} />
));

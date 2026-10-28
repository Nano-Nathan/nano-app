'use client';

import authController from '../controllers/auth.controller';
import Form from './Form';

/** Fields of the sign-in */
const LOGIN = [
  { name: 'email', type: 'email', required: true },
  { name: 'password', type: 'password', required: true },
];

/** Sign-in form: goes to the private page once signed in */
export default authController.bindView(({ signIn, navTo }) => {
  // Signs in with the values of the form
  const fnSubmit = async (oValues: unknown) => {
    const oResponse = await signIn(oValues);
    if (oResponse?.success) navTo('/private');
  };

  return <Form name="login" fields={LOGIN} onSubmit={fnSubmit} />;
});

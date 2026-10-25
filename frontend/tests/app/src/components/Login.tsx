'use client';

import { useRouter } from 'next/navigation';
import sessionController from '../controllers/session.controller';
import type { FormEvent } from 'react';

/** Sign-in form: goes to the private page once signed in */
export default sessionController.bindView(({ signIn }) => {
  const oRouter = useRouter();

  // Signs in with the email and password of the form
  const fnSubmit = async (oEvent: FormEvent<HTMLFormElement>) => {
    oEvent.preventDefault();
    const oForm = new FormData(oEvent.currentTarget);
    const oResponse = await signIn(String(oForm.get('email')), String(oForm.get('password')));
    if (oResponse.success) oRouter.push('/private');
  };

  return (
    <form onSubmit={fnSubmit}>
      <input name="email" type="email" placeholder="email" />
      <input name="password" type="password" placeholder="password" />
      <button>sign in</button>
    </form>
  );
});

'use client';

import authController from '../controllers/auth.controller';

/** User of the session, with a button to sign out */
export default authController.bindView(({ stores: { backend }, signOut }) => {
  // Shows the user of the session, or that there is none
  const oSession = backend.get('/session');
  if (!oSession) return <p>No session</p>;

  return (
    <p>
      {oSession.user.email} <button onClick={signOut}>sign out</button>
    </p>
  );
});

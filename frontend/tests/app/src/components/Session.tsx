'use client';

import { useEffect } from 'react';
import sessionController from '../controllers/session.controller';

/** User of the session, with a button to sign out */
export default sessionController.bindView(({ stores: { backend }, load, signOut }) => {
  // Reads the session once the view is on the page
  useEffect(() => {
    load();
  }, []);

  // Shows the user of the session, or that there is none
  const oSession = backend.get('/session');
  if (!oSession) return <p>No session</p>;

  return (
    <p>
      {oSession.user.email} <button onClick={signOut}>sign out</button>
    </p>
  );
});

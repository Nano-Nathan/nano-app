'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import sessionController from '../controllers/session.controller';

/** Renders its children only with a session, and goes to the login without one */
export default sessionController.bindView(({ props, stores: { backend }, load }) => {
  const oRouter = useRouter();
  const oSession = backend.get('/session');

  // Reads the session once the view is on the page
  useEffect(() => {
    load();
  }, []);

  // Goes to the login when there is no session, also after a 401
  useEffect(() => {
    if (oSession === null) oRouter.replace('/login');
  }, [oSession]);

  // Renders the page only with a session
  return oSession ? props.children : null;
});

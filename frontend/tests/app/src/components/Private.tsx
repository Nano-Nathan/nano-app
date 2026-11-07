'use client';

import { useEffect } from 'react';
import authController from '../controllers/auth.controller';

/** Renders its children only with a session, and goes to the login without one */
export default authController.bindView(({ props, stores: { backend }, navTo }) => {
  const oSession = backend.get('/session');

  // Goes to the login when there is no session, also after a 401
  useEffect(() => {
    if (oSession === null) navTo('/login');
  }, [oSession]);

  // Renders the page only with a session
  return oSession ? props.children : null;
});

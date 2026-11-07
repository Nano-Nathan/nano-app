'use client';

import { useEffect } from 'react';
import authController from '../controllers/auth.controller';

/** Renders its children only with a session, and goes to the login without one */
export default authController
  .extend(({ stores: { backend } }) => ({
    guard(): void {
      // Goes to the login when there is no session, also after a 401
      if (backend.get('/session') === null) this.navTo('/login');
    },
  }))
  .bindView(({ props, stores: { backend }, guard }) => {
    // Runs the guard when the session changes
    useEffect(guard, [backend.get('/session')]);

    // Renders the page only with a session
    return backend.get('/session') ? props.children : null;
  });

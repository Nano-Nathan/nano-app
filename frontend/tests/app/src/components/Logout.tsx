'use client';

import { createView } from '@nano-app/frontend';
import BackendAuthController from '../controllers/auth.controller';

/** Button that signs out and goes to the login */
export default createView(BackendAuthController, auth => (
  <button onClick={auth.logout}>sign out</button>
));

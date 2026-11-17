import { createPage } from '@nano-app/frontend/server';
import Logout from '../../src/components/Logout';

/** View /private: only with a session of the backend store */
export default createPage({ store: 'backend', redirect: '/login' }, ({ session }) => (
  <main>
    <h1>Private</h1>
    <p>
      {session.user.email} <Logout />
    </p>
  </main>
));

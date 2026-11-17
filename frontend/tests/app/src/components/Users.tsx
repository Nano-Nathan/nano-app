'use client';

import { createView } from '@nano-app/frontend';
import UsersController from '../controllers/users.controller';

/** Users of the backend store: read, added, renamed and removed */
export default createView(UsersController, users => (
  <section>
    <p>{users.stores.backend.get('/busy') ? 'Loading…' : 'Users'}</p>
    <ul>
      {(users.stores.backend.get('/users')?.result ?? []).map(
        (oUser: { id: number; name: string }) => (
          <li key={oUser.id}>
            {oUser.name}
            <button onClick={() => users.rename(oUser.id, `${oUser.name}!`)}>rename</button>
            <button onClick={() => users.remove(oUser.id)}>remove</button>
          </li>
        ),
      )}
    </ul>
    <button onClick={() => users.add('New user')}>add</button>
  </section>
));

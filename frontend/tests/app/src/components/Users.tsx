'use client';

import { useEffect } from 'react';
import usersController from '../controllers/users.controller';

/** Users of the backend store: read, added, renamed and removed */
export default usersController.bindView(({ stores: { backend }, load, add, rename, remove }) => {
  // Reads the users once the view is on the page
  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <p>{backend.get('/busy') ? 'Loading…' : 'Users'}</p>
      <ul>
        {(backend.get('/users')?.result ?? []).map((oUser: { id: number; name: string }) => (
          <li key={oUser.id}>
            {oUser.name}
            <button onClick={() => rename(oUser.id, `${oUser.name}!`)}>rename</button>
            <button onClick={() => remove(oUser.id)}>remove</button>
          </li>
        ))}
      </ul>
      <button onClick={() => add('New user')}>add</button>
    </section>
  );
});

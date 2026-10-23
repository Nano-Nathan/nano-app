'use client';

import usersController from '../controllers/users.controller';

/** Users of the backend store: read, added, renamed and removed */
export default usersController.bindView(({ stores: { backend }, add, rename, remove }) => (
  <section>
    <p>{backend.busy ? 'Loading…' : 'Users'}</p>
    <ul>
      {(backend.read('/users') ?? []).map((oUser: { id: number; name: string }) => (
        <li key={oUser.id}>
          {oUser.name}
          <button onClick={() => rename(oUser.id, `${oUser.name}!`)}>rename</button>
          <button onClick={() => remove(oUser.id)}>remove</button>
        </li>
      ))}
    </ul>
    <button onClick={() => add('New user')}>add</button>
  </section>
));

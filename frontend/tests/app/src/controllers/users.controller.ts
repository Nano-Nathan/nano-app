import { createController } from '@nano-app/frontend';

/** Methods of the users: they write the backend, and the views read it again */
export default createController(({ stores: { backend } }) => ({
  add: (sName: string) => backend.create('/users', { name: sName }),
  rename: (iId: number, sName: string) => backend.update(`/users/${iId}`, { name: sName }),
  remove: (iId: number) => backend.delete(`/users/${iId}`),
}));

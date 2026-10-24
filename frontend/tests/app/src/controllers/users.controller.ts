import { createController } from '@nano-app/frontend';

/** Methods of the users: they read the backend, and read it again after each write */
export default createController(({ stores: { backend } }) => {
  // Reads the users into the store, where the views get them
  const fnLoad = () => backend.read('/users');

  return {
    load: fnLoad,
    add: async (sName: string) => {
      await backend.create('/users', { name: sName });
      return fnLoad();
    },
    rename: async (iId: number, sName: string) => {
      await backend.update(`/users/${iId}`, { name: sName });
      return fnLoad();
    },
    remove: async (iId: number) => {
      await backend.delete(`/users/${iId}`);
      return fnLoad();
    },
  };
});

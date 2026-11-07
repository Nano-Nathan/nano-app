import { createController } from '@nano-app/frontend';

/** Methods of the users: they read the backend, and read it again after each write */
export default createController(({ stores: { backend } }) => ({
  // Reads the users when the view mounts
  callbacks: {
    onMount(): Promise<unknown> {
      return this.load();
    },
  },
  load(): Promise<unknown> {
    // Reads the users into the store, where the views get them
    return backend.read('/users');
  },
  async add(sName: string): Promise<unknown> {
    // Creates the user and reads them again
    await backend.create('/users', { name: sName });
    return this.load();
  },
  async rename(iId: number, sName: string): Promise<unknown> {
    // Renames the user and reads them again
    await backend.update(`/users/${iId}`, { name: sName });
    return this.load();
  },
  async remove(iId: number): Promise<unknown> {
    // Removes the user and reads them again
    await backend.delete(`/users/${iId}`);
    return this.load();
  },
}));

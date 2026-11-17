import { Controller } from '@nano-app/frontend';

/** Methods of the users: they read the backend, and read it again after each write */
export default class UsersController extends Controller {
  /** Reads the users when the view mounts */
  public onMount(): Promise<unknown> {
    return this.load();
  }

  /** Reads the users into the store, where the views get them */
  public load(): Promise<unknown> {
    return this.stores.backend.GET('/users');
  }

  /** Creates the user and reads them again */
  public async add(sName: string): Promise<unknown> {
    await this.stores.backend.POST('/users', { name: sName });
    return this.load();
  }

  /** Renames the user and reads them again */
  public async rename(iId: number, sName: string): Promise<unknown> {
    await this.stores.backend.PUT(`/users/${iId}`, { name: sName });
    return this.load();
  }

  /** Removes the user and reads them again */
  public async remove(iId: number): Promise<unknown> {
    await this.stores.backend.DELETE(`/users/${iId}`);
    return this.load();
  }
}

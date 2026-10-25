import { createController } from '@nano-app/frontend';

/** Methods of the session: Better Auth of the backend store */
export default createController(({ stores: { backend } }) => ({
  load: () => backend.readSession(),
  signIn: (sEmail: string, sPassword: string) =>
    backend.signIn('email', { email: sEmail, password: sPassword }),
  signOut: () => backend.signOut(),
}));

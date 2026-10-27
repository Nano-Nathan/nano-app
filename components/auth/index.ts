import { useRouter } from 'next/navigation';
import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { Controller } from '@nano-app/frontend';
import type { AuthMethods, AuthOptions } from '../types/auth';

/** The session of an api store with Better Auth, and the navigation after it */
export default function auth(oOptions: AuthOptions = {}): Controller<AuthMethods> {
  const { kind = 'email', store = API_STORE_TYPE } = oOptions;

  return createController(({ stores }) => {
    // Takes the api store of the options, and the router of the app
    const oApi = stores[store];
    const oRouter = useRouter();

    return {
      // Better Auth's sign-in and sign-up of the kind of the options, its sign-out and its session
      signIn: async (oBody: unknown) => oApi?.signIn(kind, oBody),
      signUp: async (oBody: unknown) => oApi?.signUp(kind, oBody),
      signOut: async () => oApi?.signOut(),
      load: async () => oApi?.readSession(),
      // Goes to a url of the app
      navTo: (sUrl: string) => oRouter.push(sUrl),
    };
  });
}

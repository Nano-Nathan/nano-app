import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { AuthOptions } from '../types/auth';

/** The session of an api store with Better Auth, and the navigation after it */
export default function auth(oOptions: AuthOptions = {}) {
  const { kind = 'email', store = API_STORE_TYPE } = oOptions;

  return createController(({ stores, router }) => {
    // Takes the api store of the options
    const oApi = stores[store];

    return {
      // Reads the session when the view mounts
      callbacks: {
        onMount(): Promise<ApiResponse | undefined> {
          return this.load();
        },
      },
      // Better Auth's sign-in and sign-up of the kind of the options, its sign-out and its session
      signIn: async (oBody: unknown) => oApi?.signIn(kind, oBody),
      signUp: async (oBody: unknown) => oApi?.signUp(kind, oBody),
      signOut: async () => oApi?.signOut(),
      load: async () => oApi?.readSession(),
      // Goes to a url of the app
      navTo: (sUrl: string) => router.push(sUrl),
    };
  });
}

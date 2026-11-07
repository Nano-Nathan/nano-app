import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { AuthOptions } from '../types/auth';

/** The session of an api store with Better Auth, and the navigation after it */
export default function auth(oOptions: AuthOptions = {}) {
  const { kind = 'email', store = API_STORE_TYPE } = oOptions;

  return createController(({ stores, router }) => ({
    // Better Auth's sign-in and sign-up of the kind of the options, its sign-out and its session
    signIn: async (oBody: unknown) => stores[store]?.signIn(kind, oBody),
    signUp: async (oBody: unknown) => stores[store]?.signUp(kind, oBody),
    signOut: async () => stores[store]?.signOut(),
    load: async () => stores[store]?.readSession(),
    // Goes to a url of the app
    navTo: (sUrl: string) => router.push(sUrl),
    // Reads the session when the view mounts
    callbacks: { onMount: () => stores[store]?.readSession() },
  }));
}

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
      async signIn(oBody: unknown): Promise<ApiResponse | undefined> {
        // Better Auth's sign-in of the kind of the options
        return oApi?.signIn(kind, oBody);
      },
      async signUp(oBody: unknown): Promise<ApiResponse | undefined> {
        // Better Auth's sign-up of the kind of the options
        return oApi?.signUp(kind, oBody);
      },
      async signOut(): Promise<ApiResponse | undefined> {
        // Better Auth's sign-out
        return oApi?.signOut();
      },
      async load(): Promise<ApiResponse | undefined> {
        // Reads the session
        return oApi?.readSession();
      },
      navTo(sUrl: string): void {
        // Goes to a url of the app
        router.push(sUrl);
      },
    };
  });
}

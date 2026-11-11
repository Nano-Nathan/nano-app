import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { AuthOptions } from '../types/auth';

/** Sign-in, sign-up and sign-out of an api store with Better Auth, and the navigation after them */
export default function auth(oOptions: AuthOptions = {}) {
  const { kind = 'email', store = API_STORE_TYPE } = oOptions;

  return createController(({ stores, router }) => {
    // Takes the api store of the options
    const oApi = stores[store];

    return {
      async signIn(oBody: unknown): Promise<ApiResponse> {
        // Better Auth's sign-in of the kind of the options
        return oApi.post(`/sign-in/${kind}`, oBody);
      },
      async signUp(oBody: unknown): Promise<ApiResponse> {
        // Better Auth's sign-up of the kind of the options
        return oApi.post(`/sign-up/${kind}`, oBody);
      },
      async signOut(): Promise<ApiResponse> {
        // Better Auth's sign-out
        return oApi.post('/sign-out');
      },
      navTo(sUrl: string): void {
        // Goes to a url of the app
        router.push(sUrl);
      },
    };
  });
}

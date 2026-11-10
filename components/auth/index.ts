import { createController } from '@nano-app/frontend';
import { API_STORE_TYPE } from '@nano-app/core/const';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { AuthOptions } from '../types/auth';

/** Better Auth's client of an api store with `auth`, and the navigation after it */
export default function auth(oOptions: AuthOptions = {}) {
  const { kind = 'email', store = API_STORE_TYPE } = oOptions;

  return createController(({ stores, router }) => {
    // Takes the api store of the options
    const oApi = stores[store];

    return {
      async signIn(oBody: NanoObject): Promise<NanoObject> {
        // Better Auth's sign-in of the kind of the options
        return oApi.auth.signIn[kind](oBody);
      },
      async signUp(oBody: NanoObject): Promise<NanoObject> {
        // Better Auth's sign-up of the kind of the options
        return oApi.auth.signUp[kind](oBody);
      },
      async signOut(): Promise<NanoObject> {
        // Better Auth's sign-out
        return oApi.auth.signOut();
      },
      navTo(sUrl: string): void {
        // Goes to a url of the app
        router.push(sUrl);
      },
    };
  });
}

import type { BetterAuthPlugin } from 'better-auth';

/** Plugin of Better Auth that answers every request to its endpoints with an `ApiResponse` */
export default async function contract(): Promise<BetterAuthPlugin> {
  // Better Auth is an optional dependency: imported only when it is on
  const { APIError, createAuthMiddleware } = await import('better-auth/api');

  return {
    id: 'nano-app-contract',
    hooks: {
      after: [
        {
          // Only requests: the server's own calls (`api.getSession`) keep Better Auth's answer
          matcher: oContext => Boolean(oContext.request),
          handler: createAuthMiddleware(async oContext => {
            // A response of its own (a redirect, a page) goes as it is
            const oReturned = oContext.context.returned;
            if (oReturned instanceof Response) return;

            // A failure keeps its status; anything else is the result of a success
            oContext.context.returned =
              oReturned instanceof APIError
                ? new APIError(oReturned.status, {
                    ...oReturned.body,
                    success: false,
                    type: 'error',
                  })
                : { success: true, result: oReturned };
          }),
        },
      ],
    },
  };
}

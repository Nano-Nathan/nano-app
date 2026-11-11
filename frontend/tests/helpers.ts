/** Requests received for one method and path */
export function count(aRequests: string[], sRequest: string): number {
  return aRequests.filter(sEntry => sEntry === sRequest).length;
}

/** Answers a rewrite of the proxy as Next does: sends the request to its target with the headers the proxy set */
export async function follow(oRes: Response, oInit: RequestInit = {}): Promise<Response> {
  // An answer that is not a rewrite goes back as is
  const sTarget = oRes.headers.get('x-middleware-rewrite');
  if (!sTarget) return oRes;

  // Reads the request headers the proxy set for the backend
  const aNames = (oRes.headers.get('x-middleware-override-headers') ?? '').split(',');
  const oHeaders = new Headers(
    aNames.map((sName): [string, string] => [
      sName,
      oRes.headers.get(`x-middleware-request-${sName}`) ?? '',
    ]),
  );
  return fetch(sTarget, { ...oInit, headers: oHeaders });
}

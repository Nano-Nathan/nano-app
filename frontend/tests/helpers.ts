/** Requests received for one method and path */
export function count(aRequests: string[], sRequest: string): number {
  return aRequests.filter(sEntry => sEntry === sRequest).length;
}

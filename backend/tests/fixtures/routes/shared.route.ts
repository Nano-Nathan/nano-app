import { createRoute } from '../../../src/lib/creators';

/** What the route answers, for code outside it too */
export function greet(sName: string): string {
  return `hello ${sName}`;
}

/** Route to /shared */
export default createRoute({
  GET: async () => ({ result: greet('route') }),
});

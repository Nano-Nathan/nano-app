import { createContext } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import type { StoreFiles } from '../types/store';

/** Context of React Router with the app's stores, set by the server on each request */
export const storesContext = createContext<StoreFiles>({});

/** Loader of the root route: gives the stores to the server render and to the browser */
export function loader({ context }: LoaderFunctionArgs): { stores: StoreFiles } {
  return { stores: context.get(storesContext) };
}

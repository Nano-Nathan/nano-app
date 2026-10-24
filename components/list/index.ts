import { ApiStore, createController } from '@nano-app/frontend';
import type { ComponentContext, Controller } from '@nano-app/frontend';
import type { ListMethods, ListOptions } from '../types/list';

/** Error of an app without api stores */
const MISSING_API_STORE =
  "[nano-app] [ERROR] list needs an api store. Add a src/stores/<name>.store.ts with type 'api'.";

/** A paged and sortable list of a backend path; its state lives at `/list` of the app store */
export default function list(oOptions: ListOptions): Controller<ListMethods> {
  const { path, top, store } = oOptions;

  return createController(({ stores }) => {
    // Finds the app store and the api store
    const { app } = stores;
    const oApi = apiStore(stores, store);

    // Reads the page and the order chosen by the user
    const iPage: number = app.get('/list/iPage') ?? 0;
    const oOrderby = app.get('/list/oOrderby');

    return {
      // Reads the page from the backend, with the order
      items: oApi.read(path, { skip: iPage * top, top, orderby: oOrderby }),
      page: iPage,
      busy: oApi.busy,
      next: () => app.set('/list/iPage', iPage + 1),
      prev: () => app.set('/list/iPage', Math.max(iPage - 1, 0)),
      sort: (sField: string) => {
        // Toggles the field between ascending and descending, and goes back to the first page
        const sDirection = oOrderby?.[sField] === 'asc' ? 'desc' : 'asc';
        app.set('/list/oOrderby', { [sField]: sDirection });
        app.set('/list/iPage', 0);
      },
    };
  });
}

/** The api store named in the options, or the only one of the app */
function apiStore(oStores: ComponentContext['stores'], sName?: string): ApiStore {
  // Finds the api stores of the app
  const aNames = Object.keys(oStores).filter(sKey => oStores[sKey] instanceof ApiStore);

  // Takes the named one, or the only one
  if (sName && aNames.includes(sName)) return oStores[sName];
  if (sName) throw new Error(`[nano-app] [ERROR] list: "${sName}" is not an api store.`);
  if (aNames.length === 1) return oStores[aNames[0]];
  if (!aNames.length) throw new Error(MISSING_API_STORE);

  throw new Error(
    `[nano-app] [ERROR] list: the app has several api stores (${aNames.join(', ')}). Pass its name in "store".`,
  );
}

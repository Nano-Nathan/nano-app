import { ApiStore, createController } from '@nano-app/frontend';
import type { Controller } from '@nano-app/frontend';
import type { ListMethods, ListOptions } from '../types/list';

/** A paged and sortable list of a backend path; its state lives at `/list` of the app store */
export default function list(oOptions: ListOptions): Controller<ListMethods> {
  const { path, top } = oOptions;

  return createController(({ stores }) => {
    // Finds the app store and the api store of the app
    const { app } = stores;
    const oApi = Object.values(stores).find(oStore => oStore instanceof ApiStore);

    // Reads the page and the order chosen by the user
    const iPage: number = app.get('/list/page') ?? 0;
    const oOrderby = app.get('/list/orderby');

    return {
      // Reads the page from the backend, with the order
      items: oApi?.read(path, { skip: iPage * top, top, orderby: oOrderby }),
      page: iPage,
      busy: oApi?.busy ?? 0,
      next: () => app.set('/list/page', iPage + 1),
      prev: () => app.set('/list/page', Math.max(iPage - 1, 0)),
      sort: (sField: string) => {
        // Toggles the field between ascending and descending, and goes back to the first page
        const sDirection = oOrderby?.[sField] === 'asc' ? 'desc' : 'asc';
        app.set('/list/orderby', { [sField]: sDirection });
        app.set('/list/page', 0);
      },
    };
  });
}

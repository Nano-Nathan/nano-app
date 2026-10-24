/** Options of `list` */
export type ListOptions = {
  /** Backend path it reads (`/users`) */
  path: string;
  /** Items per page */
  top: number;
};

/** What the view of a `list` receives */
export type ListMethods = {
  /** Items of the current page, `undefined` until they arrive */
  // any: the items are the consumer's, unknown to the framework
  items: any[] | undefined;
  /** Current page, from 0 */
  page: number;
  /** Requests in progress of the api store */
  busy: number;
  /** Goes to the next page */
  next(): void;
  /** Goes to the previous page; stays on the first */
  prev(): void;
  /** Orders by a field: ascending, and descending when it was already ascending */
  sort(field: string): void;
};

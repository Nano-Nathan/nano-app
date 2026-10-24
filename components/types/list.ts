/** Options of `list` */
export type ListOptions = {
  /** Backend path it reads (`/users`) */
  path: string;
  /** Items per page */
  top: number;
  /** Name of the api store it reads (`api` by default) */
  store?: string;
};

/** Methods a `list` gives its view; the page (`/list/page`) and the order (`/list/orderby`) are read from its api store */
export type ListMethods = {
  /** Items of the current page, `undefined` until they arrive */
  // any: the items are the consumer's, unknown to the framework
  items(): any[] | undefined;
  /** Goes to the next page */
  next(): void;
  /** Goes to the previous page; stays on the first */
  prev(): void;
  /** Orders by a field: ascending, and descending when it was already ascending */
  sort(field: string): void;
};

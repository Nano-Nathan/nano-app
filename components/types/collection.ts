/** Options of `collection` */
export type CollectionOptions = {
  /** Name of its state in `app`: `/collection/<name>` */
  name: string;
  /** Backend path it reads (`/users`) */
  path: string;
  /** Items per page */
  limit: number;
  /** Name of the api store it reads (`api` by default) */
  store?: string;
};

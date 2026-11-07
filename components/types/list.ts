/** Options of `list` */
export type ListOptions = {
  /** Backend path it reads (`/users`) */
  path: string;
  /** Items per page */
  top: number;
  /** Name of the api store it reads (`api` by default) */
  store?: string;
};

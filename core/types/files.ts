import type { RouteEntry } from './objects';
import type { StoreFile } from './store';

/** What each kind of file nano-app finds holds, once validated */
export type FileEntries = {
  route: RouteEntry;
  store: StoreFile;
};

/** Kinds of file nano-app finds and validates */
export type FindableExtension = keyof FileEntries;

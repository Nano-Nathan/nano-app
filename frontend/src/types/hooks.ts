// any: the state is the consumer's, unknown to the framework

/** What `useStore` returns: reads bound to the render, writes to the state */
export type StoreHandle = {
  /** Value at a path (`/drawer/isOpen`); the component re-renders when it changes */
  get: <T = any>(path: string) => T;
  /** Writes a value at a path, creating the levels that are missing */
  set: (path: string, value: unknown) => void;
};

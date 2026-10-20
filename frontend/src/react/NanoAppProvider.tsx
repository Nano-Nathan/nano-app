'use client';

import type { ReactNode } from 'react';

/** Root of the app's React tree: wraps the root layout */
export function NanoAppProvider({ children }: { children: ReactNode }): ReactNode {
  return children;
}

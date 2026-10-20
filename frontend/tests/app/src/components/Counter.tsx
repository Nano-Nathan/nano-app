'use client';

import { useStore } from '@nano-app/frontend';
import type { ReactNode } from 'react';

/** Counter kept in the app store */
export default function Counter(): ReactNode {
  const oApp = useStore('app');
  const iCounter = oApp.get<number>('/counter');

  return (
    <button type="button" onClick={() => oApp.set('/counter', iCounter + 1)}>
      counter: {iCounter}
    </button>
  );
}

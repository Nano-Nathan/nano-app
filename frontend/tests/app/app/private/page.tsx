import Session from '../../src/components/Session';
import type { ReactNode } from 'react';

/** View /private */
export default function PrivatePage(): ReactNode {
  return (
    <main>
      <h1>Private</h1>
      <Session />
    </main>
  );
}

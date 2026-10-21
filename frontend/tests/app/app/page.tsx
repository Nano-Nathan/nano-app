import Counter from '../src/components/Counter';
import type { ReactNode } from 'react';

/** View / */
export default function Page(): ReactNode {
  return (
    <main>
      <h1>nano-app</h1>
      <Counter />
    </main>
  );
}

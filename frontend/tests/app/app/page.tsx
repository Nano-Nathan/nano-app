import Counter from '../src/components/Counter';
import Users from '../src/components/Users';
import type { ReactNode } from 'react';

/** View / */
export default function Page(): ReactNode {
  return (
    <main>
      <h1>nano-app</h1>
      <Counter />
      <Users />
    </main>
  );
}

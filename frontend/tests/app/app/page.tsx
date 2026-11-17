import Counter from '../src/components/Counter';
import Errors from '../src/components/Errors';
import Users from '../src/components/Users';
import UsersList from '../src/components/UsersList';
import type { ReactNode } from 'react';

/** View / */
export default function Page(): ReactNode {
  return (
    <main>
      <h1>nano-app</h1>
      <Counter />
      <Users />
      <UsersList />
      <Errors />
    </main>
  );
}

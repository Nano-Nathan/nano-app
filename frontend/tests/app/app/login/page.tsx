import Errors from '../../src/components/Errors';
import Login from '../../src/components/Login';
import type { ReactNode } from 'react';

/** View /login */
export default function LoginPage(): ReactNode {
  return (
    <main>
      <h1>Sign in</h1>
      <Login />
      <Errors />
    </main>
  );
}

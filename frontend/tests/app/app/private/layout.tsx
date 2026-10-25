import Private from '../../src/components/Private';
import type { ReactNode } from 'react';

/** Layout of /private: only with a session */
export default function PrivateLayout({ children }: { children: ReactNode }): ReactNode {
  return <Private>{children}</Private>;
}

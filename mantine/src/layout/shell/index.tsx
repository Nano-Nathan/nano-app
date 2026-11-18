import { createPage } from '@nano-app/frontend/server';
import Shell from './Shell';
import type { ReactNode } from 'react';
import type { ShellOptions } from '../../types/shell';

/** Layout of the pages with a session: the header, the navbar and the page; without one it goes to `login` */
export default function createShell(
  oOptions: ShellOptions,
): (props: { children: ReactNode }) => Promise<ReactNode> {
  const { title, logo, links, login = '/login' } = oOptions;
  return createPage<{ children: ReactNode }>({ redirect: login }, ({ children, session }) => {
    // The user of the session, only what the navbar shows
    const { name, email, image } = session.user;
    return (
      <Shell title={title} logo={logo} links={links} login={login} user={{ name, email, image }}>
        {children}
      </Shell>
    );
  });
}

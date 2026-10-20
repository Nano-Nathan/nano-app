import { NanoAppProvider } from '@nano-app/frontend';
import type { ReactNode } from 'react';

/** Root layout: every view gets the stores */
export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body>
        <NanoAppProvider>{children}</NanoAppProvider>
      </body>
    </html>
  );
}

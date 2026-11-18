import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { NanoAppProvider } from '@nano-app/frontend';
import { Toasts } from '../components/notification';
import type { ReactNode } from 'react';
import type { LayoutOptions } from '../types/layout';

/** Root layout of a Next app with Mantine: its html, the color scheme script, the providers and the notifications */
export default function createLayout(
  oOptions: LayoutOptions,
): (props: { children: ReactNode }) => ReactNode {
  const { lang, colorScheme = 'auto', provider, notifications } = oOptions;
  return function RootLayout({ children }: { children: ReactNode }): ReactNode {
    return (
      <html lang={lang} {...mantineHtmlProps}>
        <head>
          <ColorSchemeScript defaultColorScheme={colorScheme} />
        </head>
        <body>
          <MantineProvider {...provider} defaultColorScheme={colorScheme}>
            <NanoAppProvider>
              <Toasts {...notifications} />
              {children}
            </NanoAppProvider>
          </MantineProvider>
        </body>
      </html>
    );
  };
}

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { NanoAppProvider } from '@nano-app/frontend';
import { Errors } from '../components/feedback';
import type { ReactNode } from 'react';
import type { LayoutOptions } from '../types/layout';

/** Root layout of a Next app with Mantine: its html, the color scheme script, the providers and the errors */
export default function createLayout(
  oOptions: LayoutOptions,
): (props: { children: ReactNode }) => ReactNode {
  // The language goes to the html, the rest to MantineProvider
  const { lang, ...oProvider } = oOptions;
  return function RootLayout({ children }: { children: ReactNode }): ReactNode {
    return (
      <html lang={lang} {...mantineHtmlProps}>
        <head>
          <ColorSchemeScript
            defaultColorScheme={oProvider.defaultColorScheme}
            forceColorScheme={oProvider.forceColorScheme}
          />
        </head>
        <body>
          <MantineProvider {...oProvider}>
            <Notifications position="top-center" />
            <NanoAppProvider>
              <Errors />
              {children}
            </NanoAppProvider>
          </MantineProvider>
        </body>
      </html>
    );
  };
}

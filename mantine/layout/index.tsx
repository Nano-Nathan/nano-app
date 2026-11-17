import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { NanoAppProvider } from '@nano-app/frontend';
import type { ReactNode } from 'react';
import type { LayoutOptions } from '../types/layout';

/** Root layout of a Next app with Mantine: its html, the color scheme script and the providers */
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
            <NanoAppProvider>{children}</NanoAppProvider>
          </MantineProvider>
        </body>
      </html>
    );
  };
}

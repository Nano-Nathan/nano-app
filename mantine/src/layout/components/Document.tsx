import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { NanoAppProvider } from '@nano-app/frontend';
import { Toasts } from '../../components/notification';
import type { ReactNode } from 'react';
import type { LayoutOptions } from '../../types/layout';

/** The html of the app: its language, the color scheme script, the providers and the notifications */
export default function Document({
  options,
  locale,
  children,
}: {
  options: LayoutOptions;
  locale?: string;
  children: ReactNode;
}): ReactNode {
  const { lang, colorScheme = 'auto', provider, notifications } = options;
  return (
    <html lang={locale ?? lang} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme={colorScheme} />
      </head>
      <body>
        <MantineProvider {...provider} defaultColorScheme={colorScheme}>
          <NanoAppProvider locale={locale}>
            <Toasts {...notifications} />
            {children}
          </NanoAppProvider>
        </MantineProvider>
      </body>
    </html>
  );
}

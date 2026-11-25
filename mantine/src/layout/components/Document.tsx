import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { NanoAppProvider } from '@nano-app/frontend';
import { Toasts } from '../../components/notification';
import { GROUND } from './const';
import Provider from './Provider';
import type { ReactNode } from 'react';
import type { LayoutOptions } from '../../types/layout';

/** The html of the app: its language, the color scheme script, its ground, the providers and the notifications */
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
  // The locale the user chose, else the app's language
  const sLocale = locale ?? lang;
  return (
    <html lang={sLocale} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme={colorScheme} />
      </head>
      <body style={GROUND}>
        <Provider provider={provider} colorScheme={colorScheme} locale={sLocale}>
          <NanoAppProvider locale={locale}>
            <Toasts {...notifications} />
            {children}
          </NanoAppProvider>
        </Provider>
      </body>
    </html>
  );
}

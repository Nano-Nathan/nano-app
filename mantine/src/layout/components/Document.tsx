import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { NanoAppProvider } from '@nano-app/frontend';
import { Progress, Toasts } from '../../components/notification';
import { CONTRAST, GROUND } from './const';
import { NANO_CSS } from './css';
import Provider from './Provider';
import type { ReactNode } from 'react';
import type { LayoutOptions } from '../../types/layout';

/** The html of the app: its language, the color scheme script, its ground, the providers, the progress bar and the notifications */
export default function Document({
  options,
  locale,
  children,
}: {
  options: LayoutOptions;
  locale?: string;
  children: ReactNode;
}): ReactNode {
  const { lang, className, colorScheme = 'auto', provider, notifications } = options;
  // The locale the user chose, else the app's language
  const sLocale = locale ?? lang;
  return (
    <html lang={sLocale} className={className} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme={colorScheme} />
        <style>{NANO_CSS}</style>
      </head>
      <body style={{ ...GROUND, ...CONTRAST }}>
        <Provider provider={provider} colorScheme={colorScheme} locale={sLocale}>
          <NanoAppProvider locale={locale}>
            <Progress />
            <Toasts {...notifications} />
            {children}
          </NanoAppProvider>
        </Provider>
      </body>
    </html>
  );
}

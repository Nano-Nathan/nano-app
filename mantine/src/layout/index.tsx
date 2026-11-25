import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { getLocale } from '@nano-app/frontend/server';
import Document from './components/Document';
import type { ReactNode } from 'react';
import type { LayoutOptions } from '../types/layout';

/** Root layout of a Next app with Mantine, in the locale the user chose */
export default function createLayout(
  oOptions: LayoutOptions,
): (props: { children: ReactNode }) => Promise<ReactNode> {
  return async function RootLayout({ children }: { children: ReactNode }): Promise<ReactNode> {
    // The locale of the user's cookie, over the app's
    const sLocale = await getLocale();
    return (
      <Document options={oOptions} locale={sLocale}>
        {children}
      </Document>
    );
  };
}

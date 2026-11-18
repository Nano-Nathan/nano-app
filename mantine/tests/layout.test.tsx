// First: the stores, before the frontend loads
import './env';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import Document from '../src/layout/components/Document';
import { oRouter } from './provider';
import type { ReactNode } from 'react';

/** The html of a document inside the router of the app, like the root layout of Next */
function renderDocument(oDocument: ReactNode): string {
  return renderToStaticMarkup(
    <AppRouterContext.Provider value={oRouter}>{oDocument}</AppRouterContext.Provider>,
  );
}

test('the document renders the html of its language, the color scheme script and the children', () => {
  // Document in Spanish, dark by default
  const sHtml = renderDocument(
    <Document options={{ lang: 'es', colorScheme: 'dark' }}>
      <p>child</p>
    </Document>,
  );

  // Its html, the script of its color scheme and the children inside the providers
  assert.match(sHtml, /^<html lang="es" data-mantine-color-scheme="light">/);
  assert.match(sHtml, /<head><script data-mantine-script="true">[^<]*: "dark";/);
  assert.match(sHtml, /<body style="[^"]*">.*<p>child<\/p><\/body>/s);
});

test('the document follows the color scheme of the system by default', () => {
  // Document without a color scheme
  const sHtml = renderDocument(
    <Document options={{ lang: 'es' }}>
      <p>child</p>
    </Document>,
  );

  // The script falls back to auto
  assert.match(sHtml, /<head><script data-mantine-script="true">[^<]*: "auto";/);
});

test('the locale the user chose is the language of the html', () => {
  // Document of an app in Spanish, with a user that chose English
  const sHtml = renderDocument(
    <Document options={{ lang: 'es' }} locale="en">
      <p>child</p>
    </Document>,
  );

  assert.match(sHtml, /^<html lang="en" /);
});

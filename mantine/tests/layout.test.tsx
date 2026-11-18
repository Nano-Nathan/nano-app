// First: the stores, before the frontend loads
import './env';
import './css';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';

// The layout once the hook of css.ts runs: static imports load before any of them runs
const { default: createLayout } = await import('../src/layout');

test('createLayout renders the html of its language, the color scheme script and the children', () => {
  // Layout in Spanish, dark by default
  const RootLayout = createLayout({ lang: 'es', colorScheme: 'dark' });
  const sHtml = renderToStaticMarkup(
    <RootLayout>
      <p>child</p>
    </RootLayout>,
  );

  // Its html, the script of its color scheme and the children inside the providers
  assert.match(sHtml, /^<html lang="es" data-mantine-color-scheme="light">/);
  assert.match(sHtml, /<head><script data-mantine-script="true">[^<]*: "dark";/);
  assert.match(sHtml, /<body>.*<p>child<\/p><\/body>/s);
});

test('createLayout follows the color scheme of the system by default', () => {
  // Layout without a color scheme
  const RootLayout = createLayout({ lang: 'es' });
  const sHtml = renderToStaticMarkup(
    <RootLayout>
      <p>child</p>
    </RootLayout>,
  );

  // The script falls back to auto
  assert.match(sHtml, /<head><script data-mantine-script="true">[^<]*: "auto";/);
});

// First: CSS and the stores, before the layout loads
import './css';
import './env';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import createLayout from '../layout';

test('createLayout renders the html of its language, the color scheme script and the children', () => {
  // Layout in Spanish, dark by default
  const RootLayout = createLayout({ lang: 'es', defaultColorScheme: 'dark' });
  const sHtml = renderToStaticMarkup(
    <RootLayout>
      <p>child</p>
    </RootLayout>,
  );

  // Its html, the script of its color scheme and the children inside the providers
  assert.match(sHtml, /^<html lang="es" data-mantine-color-scheme="light">/);
  assert.match(sHtml, /<head><script data-mantine-script="true">[^<]*: "dark";/);
  assert.match(sHtml, /<body>.*<p>child<\/p>.*<\/body>/);
});

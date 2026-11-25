import { rem } from '@mantine/core';
import { COLUMNS_VAR, NANO_CLASSES, token } from '../../const';
import { ACCENT, LINE, shade, tint } from './const';

/** Selector of the tables of the theme */
const TABLE = `.${NANO_CLASSES.table}`;

/** Radius of the corners of a row */
const ROW_RADIUS = 'var(--mantine-radius-md)';

/** Rules the theme's inline styles cannot hold. Tables: a grid whose header, body and rows share its columns (`subgrid`, widths from the content), so only the body scrolls, under a line below the header; its rows apart as rounded bands of one neutral tint that take the accent on hover and focus. Inputs on light: a border and a placeholder that reach the contrast of WCAG (3:1 and 4.5:1); dark, focus and error keep Mantine's */
export const NANO_CSS = [
  // The table: a column per field, the header above the body, and the body as high as the space left
  `${TABLE} { display: grid; grid-template-columns: repeat(var(${COLUMNS_VAR}), auto); grid-template-rows: auto minmax(0, 1fr); min-height: 0; }`,
  `${TABLE} thead, ${TABLE} tbody, ${TABLE} tr { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; }`,
  // The body scrolls without bars from the line below the header
  `${TABLE} thead th { border-bottom: ${LINE}; }`,
  `${TABLE} tbody { overflow-y: auto; scrollbar-width: none; align-content: start; row-gap: ${token('row-gap')}; padding-top: ${token('row-gap')}; }`,
  // Rows: rounded bands that open on a click, tinted by the accent on hover and focus
  `${TABLE} tbody tr { cursor: pointer; }`,
  `${TABLE} tbody td { background: ${shade(token('row'))}; transition: background ${token('row-motion')}; }`,
  `${TABLE} tbody tr:hover td, ${TABLE} tbody tr:focus-visible td { background: ${tint(token('row-hover'))}; }`,
  `${TABLE} tbody tr:focus-visible { outline: ${rem(2)} solid ${ACCENT}; outline-offset: calc(-1 * ${rem(2)}); border-radius: ${ROW_RADIUS}; }`,
  `${TABLE} tbody tr > :first-child { border-start-start-radius: ${ROW_RADIUS}; border-end-start-radius: ${ROW_RADIUS}; }`,
  `${TABLE} tbody tr > :last-child { border-start-end-radius: ${ROW_RADIUS}; border-end-end-radius: ${ROW_RADIUS}; }`,
  `@media (prefers-reduced-motion: reduce) { ${TABLE} tbody td { transition: none; } }`,
  // Inputs on light
  '.mantine-Input-input:not(:focus):not([data-error]) { border-color: light-dark(var(--mantine-color-gray-6), var(--mantine-color-dark-4)); }',
  `.mantine-Input-input::placeholder { color: light-dark(${shade(token('placeholder'))}, var(--mantine-color-placeholder)); }`,
].join('\n');

import type { NanoObject } from '@nano-app/core/types/objects';

/** A field of a form's config; the keys the field does not use pass as is to its view */
export type FormField = NanoObject & {
  /** Key of its value (`email`) */
  name: string;
  /** `email` and `number` also validate its value, and `number` keeps a number */
  type?: string;
  /** Whether the user must give it a value: missing or `''` breaks it */
  required?: boolean;
  /** Message of the default rules it breaks, instead of `Required`, `Invalid email` or `Invalid number` */
  errorMessage?: string;
  /** Own rule, after the default ones: the message when the value breaks it */
  // any: the value is what the field's view gives `change`
  validate?(value: any, values: NanoObject): string | undefined;
  /** What the view shows of the value kept (`1234` → `$1.234`) */
  // any: the value is what `change` kept
  format?(value: any): unknown;
  /** What to keep of what the view gives `change` (`$1.234` → `1234`), instead of the default */
  // any: the input is what the field's view gives `change`
  parse?(input: any): unknown;
  /** Items of a select, read from its api store */
  options?: FieldOptions;
};

/** Items of a select: a path of an api store and the keys of each item */
export type FieldOptions = {
  /** Path of the items (`/roles`) */
  path: string;
  /** Key of an item that identifies it (`id`) */
  key: string;
  /** Key of an item shown as its text (`name`) */
  label: string;
  /** Name of the api store, `api` by default */
  store?: string;
};

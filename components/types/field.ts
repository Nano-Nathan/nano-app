import type { NanoObject } from '@nano-app/core/types/objects';

/** A field of a form's config; the keys the field does not use pass as is to its view */
export type FormField = NanoObject & {
  /** Key of its value (`email`) */
  name: string;
  /** Type of its view and its zod type (`email`, `number`, `url`, `checkbox`, `date`, else text) */
  type?: string;
  /** Whether the user must give it a value: missing or `''` breaks it */
  required?: boolean;
  /** Message of the rules without their own, instead of `Required`, `Invalid email`… */
  errorMessage?: string;
  /** Zod methods of its type by name, with their value or array of values */
  rules?: NanoObject;
  /** Own rule, after the others: the message when the value breaks it */
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

/** Items of a select: a path of an api store */
export type FieldOptions = {
  /** Path of the items (`/roles`) */
  path: string;
  /** Name of the api store, `api` by default */
  store?: string;
};

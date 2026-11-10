import type { NanoObject } from '@nano-app/core/types/objects';

/** A field of a form's config; the keys the field does not use pass as is to its view */
export type FormField = NanoObject & {
  /** Key of its value (`email`) */
  name: string;
  /** Type of its view in `form`; `number` also keeps a number */
  type?: string;
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

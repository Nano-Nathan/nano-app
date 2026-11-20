import type { ZodType } from 'zod';
import type { NanoObject } from '@nano-app/core/types/objects';

/** A field a view shows: its key, its label and how its value reads */
export type Field = {
  /** Key of its value (`email`) */
  name: string;
  /** Key of the text of its label (`form.email`) */
  label?: string;
  /** What the view shows of the value kept (`1234` → `$1.234`) */
  format?(value: any): unknown;
};

/** A field of a form's config; the keys the field does not use pass as is to its view */
export type FormField = NanoObject &
  Field & {
    /** Type of its view (`text` by default); a `number` keeps its text as a number */
    type?: string;
    /** Rules of its value, a zod schema (`z.email()`); a rule between fields goes in the `onSubmit` of the form */
    validation?: ZodType;
    /** What to keep of what the view gives `change` (`$1.234` → `1234`), instead of the default */
    parse?(input: any): unknown;
    /** Items of a select, read from its api store */
    options?: FieldOptions;
  };

/** Items of a select: a path of the api store of its controller */
export type FieldOptions = {
  /** Path of the items (`/roles`) */
  path: string;
};

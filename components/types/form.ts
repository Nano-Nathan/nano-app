import type { NanoObject } from '@nano-app/core/types/objects';

/** A field of a form's config; the keys the form does not use pass as is to the field's view */
export type FormField = NanoObject & {
  /** Key of its value (`email`) */
  name: string;
  /** Component of `components` that shows it (`'text'` by default); `email` and `number` also validate it */
  type?: string;
  /** Whether the user must give it a value: missing or `''` breaks it */
  required?: boolean;
  /** Own rule, after the default ones: the message when the value breaks it */
  // any: the value is what the field's view gives `change`
  validate?(value: any, values: NanoObject): string | undefined;
};

/** Messages of the default validations */
export type FormMessages = {
  required?: string;
  email?: string;
  number?: string;
};

/** Methods a `field` gives its view */
export type FieldMethods = {
  /** Value of the field */
  // any: the value is what the field's view gives `change`
  value(): any;
  /** Message of the rule the value breaks, `undefined` when it is valid */
  error(): string | undefined;
  /** Keeps the value and validates the field */
  change(value: unknown): void;
};

import type { NanoObject } from '@nano-app/core/types/objects';

/** A field of a form's config; the keys the field does not use pass as is to its view */
export type FormField = NanoObject & {
  /** Key of its value (`email`) */
  name: string;
  /** `email` and `number` also validate its value */
  type?: string;
  /** Whether the user must give it a value: missing or `''` breaks it */
  required?: boolean;
  /** Message of the default rules it breaks, instead of `Required`, `Invalid email` or `Invalid number` */
  errorMessage?: string;
  /** Own rule, after the default ones: the message when the value breaks it */
  // any: the value is what the field's view gives `change`
  validate?(value: any, values: NanoObject): string | undefined;
};

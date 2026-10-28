import type { FormEvent, ReactNode } from 'react';
import type { ComponentProps } from '@nano-app/frontend';
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

/** A view bound to a `field` controller */
export type FieldComponent = (props: ComponentProps) => ReactNode;

/** Options of `form` */
export type FormOptions = {
  /** View of each field type (`{ text: Input, date: DatePicker }`); `text` shows the types without one */
  components: NanoObject<FieldComponent>;
  /** Messages that replace the default ones */
  messages?: FormMessages;
};

/** Methods a `form` gives its view; the values and errors are read from `/form/<name>` of the `app` store */
export type FormMethods = {
  /** The views of the fields of the config, in its order */
  fields(): ReactNode[];
  /** Validates every field and calls `onSubmit` with the values when all are valid */
  submit(event: FormEvent): Promise<void>;
  /** Empties the values and errors */
  reset(): void;
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

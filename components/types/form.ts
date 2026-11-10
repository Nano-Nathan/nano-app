import type { ReactNode } from 'react';
import type { ZodType } from 'zod';
import type { ComponentProps } from '@nano-app/frontend';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Options of `form` */
export type FormOptions = {
  /** View of each field type (`{ text: Input, select: Select }`); `text` shows the types without one */
  components: NanoObject<(props: ComponentProps) => ReactNode>;
};

/** Schema of a form, in its props: a zod object of its values, the rules of each field at its key */
export type FormSchema = ZodType<NanoObject>;

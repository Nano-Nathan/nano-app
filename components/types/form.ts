import type { ReactNode } from 'react';
import type { createFormControl } from 'react-hook-form';
import type { ComponentProps } from '@nano-app/frontend';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Options of `form` */
export type FormOptions = {
  /** View of each field type (`{ text: Input, select: Select }`); `text` shows the types without one */
  components: NanoObject<(props: ComponentProps) => ReactNode>;
};

/** A form of React Hook Form, created outside React */
export type FormControl = ReturnType<typeof createFormControl>;

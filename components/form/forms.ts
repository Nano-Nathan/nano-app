import { createFormControl } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import type { ComponentContext } from '@nano-app/frontend';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormControl, FormSchema } from '../types/form';

/** Forms of each React tree, by name */
const FORMS = new WeakMap<ComponentContext['stores'], NanoObject<FormControl>>();

/** Form of a name in a tree, created on first use with its state kept at `/form/<name>` of `app` */
export default function control(
  oStores: ComponentContext['stores'],
  sName: string,
  oSchema?: FormSchema,
): FormControl {
  // Returns the form the tree already has
  const oForms = FORMS.get(oStores) ?? {};
  FORMS.set(oStores, oForms);
  if (oForms[sName]) return oForms[sName];

  // Creates it, validated by its schema when it has one
  const oForm = createFormControl({ resolver: oSchema && standardSchemaResolver(oSchema) });

  // Keeps its values and the message of each error at `/form/<name>` of `app`
  oForm.subscribe({
    formState: { values: true, errors: true },
    callback: ({ values, errors }) => {
      const aErrors = Object.entries(errors ?? {}).map(([sField, oError]) => [
        sField,
        oError?.message,
      ]);
      oStores.app.set(`/form/${sName}`, { values, errors: Object.fromEntries(aErrors) });
    },
  });
  oForms[sName] = oForm;
  return oForm;
}

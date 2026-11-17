import { createElement } from 'react';
import { Controller } from '@nano-app/frontend';
import NanoError from '@nano-app/core/utils/NanoError';
import validate from '../field/validate';
import type { ReactNode, SubmitEvent } from 'react';
import type { ComponentProps } from '@nano-app/frontend';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** A form from a config of fields: their views, and their submit at `/form/<name>` of `app` */
export default abstract class FormController extends Controller {
  /** View of each field type (`{ text: Input, select: Select }`); `text` shows the types without one */
  public abstract components: NanoObject<(props: ComponentProps) => ReactNode>;

  /** The view of each field, with its form and its config */
  public fields(): ReactNode[] {
    const { name } = this.props;
    return this.config().map(oField => {
      // Takes the view of its type, or the one of text
      const sType = oField.type ?? 'text';
      const fnView = this.components[sType] ?? this.components.text;
      if (!fnView)
        throw new NanoError(
          `Form "${name}": the field "${oField.name}" of type "${sType}" has no view, and components has no "text" view to show it. Add one: components = { text: Input }.`,
        );

      // Renders it with its form and its config
      return createElement(fnView, { key: oField.name, form: name, field: oField });
    });
  }

  /** Validates every field and sends the values only when none breaks a rule */
  public submit(oEvent: SubmitEvent<HTMLFormElement>): any {
    // Stops the browser's submit
    oEvent.preventDefault();

    // Validates every field with its value and keeps their messages
    const { app } = this.stores;
    const oValues = app.get(`${this.path()}/values`) ?? {};
    const aErrors = this.config().map(oField => [
      oField.name,
      validate(oField, oValues[oField.name]),
    ]);
    app.set(`${this.path()}/errors`, Object.fromEntries(aErrors));

    // Sends the values only when no field breaks a rule
    if (aErrors.some(([, sError]) => sError)) return;
    return this.props.onSubmit(oValues);
  }

  /** Empties the values and the errors */
  public reset(): void {
    this.stores.app.set(this.path(), {});
  }

  /** The configs of its fields, from the props */
  private config(): FormField[] {
    return this.props.fields;
  }

  /** Path of its state in `app`: `/form/<name>` */
  private path(): string {
    return `/form/${this.props.name}`;
  }
}

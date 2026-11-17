import ApiController from '../utils/ApiController';
import validate from './validate';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** A field of a form: its value and error at `/form/<form>` of `app`, and its select items */
export default class FieldController extends ApiController {
  /** Reads the items of its options from the backend when the view mounts */
  public onMount(): Promise<ApiResponse> | undefined {
    const { path, store } = this.field().options ?? {};
    return path ? this.api(store).GET(path) : undefined;
  }

  /** The value kept, through the field's format when it has one */
  public value(): any {
    const oField = this.field();
    const oValue = this.stores.app.get(this.path('values'));
    return oField.format ? oField.format(oValue) : oValue;
  }

  /** The message of the first rule the value kept breaks */
  public error(): string | undefined {
    return this.stores.app.get(this.path('errors'));
  }

  /** Keeps the value and the message of the first rule it breaks */
  public change(oInput: unknown): void {
    const oValue = this.parse(oInput);
    this.stores.app.set(this.path('values'), oValue);
    this.stores.app.set(this.path('errors'), this.validate(oValue));
  }

  /** Its own parse; else no value for `''`, a number for one */
  public parse(oInput: unknown): unknown {
    const oField = this.field();
    if (oField.parse) return oField.parse(oInput);
    if (oInput === '') return undefined;
    const iNumber = Number(oInput);
    const isNumber = oField.type === 'number' && String(iNumber) === oInput;
    return isNumber ? iNumber : oInput;
  }

  /** The message of the first rule of its validation the value breaks */
  public validate(oValue: unknown): string | undefined {
    return validate(this.field(), oValue);
  }

  /** The items read for its options, as the backend gave them */
  public options(): NanoObject[] {
    const { path, store } = this.field().options ?? {};
    return path ? (this.api(store).get(path)?.result ?? []) : [];
  }

  /** Its config, from the props */
  private field(): FormField {
    return this.props.field;
  }

  /** Path of its value or its error in `app` */
  private path(sKind: 'values' | 'errors'): string {
    return `/form/${this.props.form}/${sKind}/${this.field().name}`;
  }
}

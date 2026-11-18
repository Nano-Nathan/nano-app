import AppController from '../utils/AppController';
import validate from './validate';
import type { ApiStore } from '@nano-app/frontend';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** A field of a form: its value and error at `/form/<form>` of `app`, and its select items */
export default class FieldController extends AppController {
  /** Api store of its options: `api` by default, another one from a subclass */
  protected api: ApiStore = this.stores.api;
  /** Path of the state of its form, from the props when it mounts */
  protected root = `/form/${this.props.form}`;

  /** Reads the items of its options from the backend when the view mounts */
  public onMount(): Promise<ApiResponse> | undefined {
    const { path } = this.field().options ?? {};
    return path ? this.api.GET(path) : undefined;
  }

  /** The value kept, through the field's format when it has one */
  public value(): any {
    const oField = this.field();
    const oValue = this.get(this.key('values'));
    return oField.format ? oField.format(oValue) : oValue;
  }

  /** The message of the first rule the value kept breaks, translated when it is a key */
  public error(): string | undefined {
    // The message of its validation, its text when it is a key of the texts
    const sError: string | undefined = this.get(this.key('errors'));
    return sError && this.text(sError);
  }

  /** Keeps the value and the message of the first rule it breaks */
  public change(oInput: unknown): void {
    const oValue = this.parse(oInput);
    this.set(this.key('values'), oValue);
    this.set(this.key('errors'), this.validate(oValue));
  }

  /** Its own parse; else no value for `''`, a number for one */
  protected parse(oInput: unknown): unknown {
    const oField = this.field();
    if (oField.parse) return oField.parse(oInput);
    if (oInput === '') return undefined;
    const iNumber = Number(oInput);
    const isNumber = oField.type === 'number' && String(iNumber) === oInput;
    return isNumber ? iNumber : oInput;
  }

  /** The message of the first rule of its validation the value breaks */
  protected validate(oValue: unknown): string | undefined {
    return validate(this.field(), oValue);
  }

  /** The items read for its options, as the backend gave them */
  public options(): NanoObject[] {
    const { path } = this.field().options ?? {};
    return path ? (this.api.get(path)?.result ?? []) : [];
  }

  /** Its config, from the props */
  private field(): FormField {
    return this.props.field;
  }

  /** Key of its value or its error in the state of its form */
  private key(sKind: 'values' | 'errors'): string {
    return `/${sKind}/${this.field().name}`;
  }
}

import ApiController from '../utils/ApiController';
import { PLACEHOLDER_TYPES } from './const';
import validate from './validate';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** A field of a form: its value and error at `/form/<form>` of `app`, and its select items */
export default class FieldController extends ApiController {
  /** Path of the state of its form, from the props when it mounts */
  protected root = `/form/${this.props.form}`;

  /** Reads the items of its options from the backend when the view mounts */
  public onMount(): Promise<ApiResponse> | undefined {
    const { path } = this.source();
    return path ? this.GET(path) : undefined;
  }

  /** The value kept, through the field's format when it has one */
  public value(): any {
    const oField = this.field();
    const oValue = this.get(this.key('values'));
    return oField.format ? oField.format(oValue) : oValue;
  }

  /** The text of its label, a key of the texts; none without a label */
  public label(): string | undefined {
    const { label } = this.field();
    return label && this.text(label);
  }

  /** The text of its placeholder: its own key, else the one of its type */
  public placeholder(): string {
    const { placeholder, type = 'text' } = this.field();
    const sType = PLACEHOLDER_TYPES.includes(type) ? type : 'text';
    return this.text(placeholder ?? `nano.form.placeholder.${sType}`);
  }

  /** The text of the message of the first rule the value kept breaks, a key of the texts */
  public error(): string | undefined {
    // The message of its validation is a key of the texts
    const sError: string | undefined = this.get(this.key('errors'));
    return sError && this.text(sError);
  }

  /** Keeps the value and the message of the first rule it breaks */
  public change(oInput: unknown): void {
    const oValue = this.parse(oInput);
    this.set(this.key('values'), oValue);
    this.set(this.key('errors'), this.validate(oValue));
  }

  /** Its own parse; else no value for `''` or `null`, its item's value for a select, a number for one */
  protected parse(oInput: unknown): unknown {
    const oField = this.field();
    if (oField.parse) return oField.parse(oInput);
    if (oInput === '' || oInput === null) return undefined;
    if (oField.type === 'select') return this.choose(oInput);
    const iNumber = Number(oInput);
    const isNumber = oField.type === 'number' && String(iNumber) === oInput;
    return isNumber ? iNumber : oInput;
  }

  /** The message of the first rule of its validation the value breaks */
  protected validate(oValue: unknown): string | undefined {
    return validate(this.field(), oValue);
  }

  /** The items of its options as a select shows them: the text of their value and their label */
  public options(): { value: string; label: string }[] {
    const { value, label } = this.source();
    return this.items().map(oItem => ({
      value: String(oItem[value]),
      label: String(oItem[label]),
    }));
  }

  /** The value of the item whose value reads as the text a select gave, of its own type */
  private choose(oInput: unknown): unknown {
    const { value } = this.source();
    return this.items().find(oItem => String(oItem[value]) === oInput)?.[value];
  }

  /** The items read for its options, from the list the backend gave */
  private items(): NanoObject[] {
    const { path } = this.source();
    return path ? (this.api.get(path)?.result?.values ?? []) : [];
  }

  /** Where its options come from: their path, and the keys of an item's value and label */
  private source(): { path?: string; value: string; label: string } {
    const { path, value = 'id', label = 'name' } = this.field().options ?? {};
    return { path, value, label };
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

import ApiController from '../utils/ApiController';
import { FIELDS_QUERY } from './const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { Field } from '../types/field';

/** The rows of a backend path, read when its view mounts: its path and columns from the props */
export default class TableController extends ApiController {
  /** Path of its state, from the path it reads (`/table/users`) */
  protected root = `/table${this.props.path}`;

  /** Reads the rows of the prop `path`, and its columns once when the view gives none */
  public onMount(): Promise<ApiResponse[]> {
    const { path, columns } = this.props;

    return Promise.all([this.GET(path), ...(columns ? [] : [this.QUERY(path, FIELDS_QUERY)])]);
  }

  /** The rows read: the values of the list */
  public rows(): NanoObject[] {
    return this.api.get(this.props.path)?.result?.values ?? [];
  }

  /** Its columns, from `columns` or the table; each label `nano.label.<name>` by default */
  public fields(): Field[] {
    const aNames: string[] = this.api.get(this.props.path, FIELDS_QUERY)?.result?.fields ?? [];
    return this.props.columns ?? aNames.map(name => ({ name, label: `nano.label.${name}` }));
  }

  /** The text of a row's cell: its field's value as `format` shows it */
  public cell(oRow: NanoObject, oField: Field): string {
    const { name, format = (oValue: unknown) => oValue ?? '' } = oField;
    return String(format(oRow[name]));
  }
}

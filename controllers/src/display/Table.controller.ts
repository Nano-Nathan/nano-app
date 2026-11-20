import ApiController from '../utils/ApiController';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

/** The rows of a backend path, read when its view mounts: its path from the props */
export default class TableController extends ApiController {
  /** Path of its state, from the path it reads (`/table/users`) */
  protected root = `/table${this.props.path}`;

  /** Reads the rows of the prop `path` when the view mounts */
  public onMount(): Promise<ApiResponse> {
    return this.GET(this.props.path);
  }

  /** The rows read: the values of the list */
  public rows(): NanoObject[] {
    return this.api.get(this.props.path)?.result?.values ?? [];
  }

  /** The text of a row's cell: its field's value as `format` shows it */
  public cell(oRow: NanoObject, oField: FormField): string {
    const { name, format = (oValue: unknown) => oValue ?? '' } = oField;
    return String(format(oRow[name]));
  }
}

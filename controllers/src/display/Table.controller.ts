import ApiController from '../utils/ApiController';
import { FIELDS_QUERY } from './const';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { Field } from '../types/field';
import type { TableAction } from '../types/table';

/** The rows of a backend path, read when its view mounts, and their form to create, edit and delete them */
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

  /** Opens the form of a row, empty for a new one, or the confirmation of its deletion */
  public open(sAction: TableAction, oRow: NanoObject = {}): void {
    this.set('/open', { action: sAction, row: oRow });
    if (sAction === 'delete') return;
    // The form takes only the values of its fields, so a write sends nothing else
    const aValues = this.fields().map(({ name }) => [name, oRow[name]]);
    this.state.set(`/form${this.root}`, { values: Object.fromEntries(aValues) });
  }

  /** The row of `action` while it is open: `{}` for a new one, `undefined` while closed */
  public opened(sAction: TableAction): NanoObject | undefined {
    const { action, row } = this.get('/open') ?? {};
    return action === sAction ? row : undefined;
  }

  /** Closes the form or the confirmation */
  public close(): void {
    this.set('/open', undefined);
  }

  /** Updates the row of the form or creates one, then reads the rows again */
  public async save(oValues: NanoObject): Promise<void> {
    const { path } = this.props;
    const { id } = this.opened('edit') ?? {};
    const oResponse = await (id ? this.PUT(`${path}/${id}`, oValues) : this.POST(path, oValues));
    await this.reload(oResponse);
  }

  /** Deletes the row of the confirmation, then reads the rows again */
  public async remove(): Promise<void> {
    const { path } = this.props;
    await this.reload(await this.DELETE(`${path}/${this.opened('delete')?.id}`));
  }

  /** Closes the form and reads the rows again once a write succeeds */
  private async reload(oResponse: ApiResponse): Promise<void> {
    if (!oResponse.success) return;
    this.close();
    await this.GET(this.props.path);
  }
}

import ApiController from '../utils/ApiController';
import type { ApiResponse, QueryParams } from '@nano-app/core/types/api';

/** A backend path read by pages or page after page; its page and order at `/collection/<name>` */
export default abstract class CollectionController extends ApiController {
  /** Name of its state in `app`: `/collection/<name>` */
  public abstract name: string;
  /** Backend path it reads (`/users`) */
  public abstract path: string;
  /** Items per page */
  public limit: number = 50;

  /** Reads the page when the view mounts */
  public onMount(): Promise<ApiResponse> {
    return this.load();
  }

  /** The page chosen by the user, from 0 */
  public page(): number {
    return this.stores.app.get(`${this.state()}/page`) ?? 0;
  }

  /** The query of the current page, in the order chosen by the user */
  public query(): QueryParams {
    return { offset: this.page() * this.limit, ...this.pagesQuery() };
  }

  /** Reads the current page */
  public load(): Promise<ApiResponse> {
    return this.api().QUERY(this.path, this.query());
  }

  /** The answer of the current page */
  public items(): ApiResponse | undefined {
    return this.api().get(this.path, this.query());
  }

  /** Reads the page after the items read so far, and keeps every item in one answer */
  public async more(): Promise<ApiResponse> {
    // Reads the page after the items read so far
    const aItems = this.pages()?.result ?? [];
    const oResponse = await this.api().QUERY(this.path, {
      ...this.pagesQuery(),
      offset: aItems.length,
    });

    // Keeps every item read so far in one answer
    const oPages = { ...oResponse, result: [...aItems, ...(oResponse.result ?? [])] };
    this.api().set(`${this.state()}/pages`, oPages);
    return oPages;
  }

  /** Every page read so far with `more`, its items in one list */
  public pages(): ApiResponse | undefined {
    return this.api().get(`${this.state()}/pages`);
  }

  /** The page size and the order chosen by the user, without the page */
  public pagesQuery(): QueryParams {
    return { limit: this.limit, orderBy: this.stores.app.get(`${this.state()}/orderBy`) };
  }

  /** Moves to a page, never before the first one, and reads it */
  public goTo(iPage: number): Promise<ApiResponse> {
    this.stores.app.set(`${this.state()}/page`, Math.max(iPage, 0));
    return this.load();
  }

  /** Reads the next page */
  public next(): Promise<ApiResponse> {
    return this.goTo(this.page() + 1);
  }

  /** Reads the page before, or the first one */
  public prev(): Promise<ApiResponse> {
    return this.goTo(this.page() - 1);
  }

  /** Toggles the order of the field and starts the pages again */
  public sort(sField: string): Promise<ApiResponse> {
    // Toggles the order of the field and forgets the pages read
    const sOrder = `${this.state()}/orderBy`;
    const sDirection = this.stores.app.get(sOrder)?.[sField] === 'asc' ? 'desc' : 'asc';
    this.stores.app.set(sOrder, { [sField]: sDirection });
    this.api().set(`${this.state()}/pages`, undefined);

    // Reads the first page
    return this.goTo(0);
  }

  /** Path of its state: `/collection/<name>` */
  private state(): string {
    return `/collection/${this.name}`;
  }
}

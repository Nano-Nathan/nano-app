import AppController from '../utils/AppController';
import type { Store } from '@nano-app/frontend';

/** Whether the app waits: a request of any api store is out, or a link to another page was followed and its page has not come yet */
export default class ProgressController extends AppController {
  /** Path of its state */
  protected root = '/progress';

  /** Listens to the clicks of the document, to know when a link leaves the page */
  public onMount(): void {
    document.addEventListener('click', this.leave);
  }

  /** Stops listening to the clicks */
  public onUnmount(): void {
    document.removeEventListener('click', this.leave);
  }

  /** Whether a request of any store is out or a page is on its way */
  public isActive(): boolean {
    const isRequesting = Object.values(this.stores).some(
      (oStore: Store) => (oStore.get('/requests') ?? 0) > 0,
    );
    return isRequesting || (this.get('/navigating') ?? false);
  }

  /** Starts a progress while it is active and completes it once it is not */
  public sync(oProgress: { start(): void; complete(): void }): void {
    if (this.isActive()) return oProgress.start();
    oProgress.complete();
  }

  /** Marks a page on its way when a click follows a link of the app to another path in the same tab */
  public leave(oEvent: MouseEvent): void {
    // Only a plain click on a link of this app that opens in this tab; Next's Link prevents the browser's, so that is no sign
    const oLink = (oEvent.target as Element | null)?.closest?.('a');
    const isPlain = oEvent.button === 0 && !oEvent.metaKey && !oEvent.ctrlKey && !oEvent.shiftKey;
    if (!oLink || !isPlain || oLink.target === '_blank' || oLink.origin !== location.origin) return;

    // Another path than this one
    if (oLink.pathname !== this.pathname) this.set('/navigating', true);
  }

  /** Marks the page arrived: its view calls it when the path changes */
  public arrive(): void {
    this.set('/navigating', false);
  }
}

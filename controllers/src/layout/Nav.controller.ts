import AppController from '../utils/AppController';

/** Navigation of the app: the link of the current page, and the menu opened with its flag */
export default class NavController extends AppController {
  /** Path of its state: its flag is on while the menu is open */
  protected root = '/nav';

  /** Whether a link leads to the current page */
  public isActive(sHref: string): boolean {
    return this.pathname === sHref;
  }

  /** Closes the menu, once a link is followed */
  public close(): void {
    this.set('/isToggled', false);
  }
}

import AppController from '../utils/AppController';
import type { NanoObject } from '@nano-app/core/types/objects';

/** Navigation of the app: the link of the current page, the menu opened with its flag and its group shown */
export default class NavController extends AppController {
  /** Path of its state: its flag is on while the menu is open */
  protected root = '/nav';

  /** Whether a link leads to the current page */
  public isActive(sHref: string): boolean {
    return this.pathname === sHref;
  }

  /** Text of the link of the current page, also inside a group; empty when no link leads to it */
  public title(aLinks: NanoObject[]): string {
    for (const { href, label, links = [] } of aLinks) {
      // The link of the page, or the one inside its group
      const sTitle = href && this.isActive(href) ? this.text(label) : this.title(links);
      if (sTitle) return sTitle;
    }
    return '';
  }

  /** Whether a group of links shows them: its label is the open one, and the menu is open */
  public isGroupOpen(sLabel: string): boolean {
    return this.isToggled() && this.get('/group') === sLabel;
  }

  /** Opens the menu with the group of a label shown, or hides the group when it was shown */
  public toggleGroup(sLabel: string): void {
    // The group shown, none when it was this one
    const sGroup = this.isGroupOpen(sLabel) ? undefined : sLabel;
    this.set('/group', sGroup);
    this.set('/isToggled', true);
  }

  /** Closes the menu, once a link is followed */
  public close(): void {
    this.set('/isToggled', false);
  }
}

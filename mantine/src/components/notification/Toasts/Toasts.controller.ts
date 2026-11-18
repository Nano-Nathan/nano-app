import ErrorController from '@nano-app/controllers/error';
import notify from '../notify';

/** Shows each failed request of the api stores as an error, and empties their lists */
export default class ToastsController extends ErrorController {
  /** Notifies the errors kept, if any, and empties their lists */
  public show(): void {
    // Nothing to show
    const aErrors = this.items();
    if (!aErrors.length) return;

    // Notifies each one and empties the lists
    for (const oError of aErrors) notify({ type: 'error', message: oError.message ?? '' });
    this.clear();
  }
}

'use client';

import { useEffect } from 'react';
import { createView } from '@nano-app/frontend';
import ErrorController from '@nano-app/components/error';
import NotificationController from '@nano-app/components/notification';

/** Turns each failed request of the api stores into a notification of the app */
class NotifyErrorController extends ErrorController {
  /** Notifications of the app, on the same context */
  protected notifications = new NotificationController({
    props: this.props,
    stores: this.stores,
    router: this.router,
  });

  /** Moves the newest error, if any, from its store to the notifications */
  public notify(): void {
    // Takes the newest error
    const oError = this.last();
    if (!oError) return;

    // Notifies it, and it leaves its store
    this.notifications.notify({ type: 'error', message: oError.message ?? '' });
    this.dismiss();
  }
}

/** Renders nothing: it turns every new error into a notification */
export default createView(NotifyErrorController, errors => {
  useEffect(errors.notify, [errors.last()]);
  return null;
});

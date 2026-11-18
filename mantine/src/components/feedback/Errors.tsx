'use client';

import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { createView } from '@nano-app/frontend';
import ErrorController from '@nano-app/components/error';

/** Shows each failed request of the api stores as a notification, until the user closes it */
class NotifyErrorController extends ErrorController {
  /** Moves the newest error, if any, from its store to a notification */
  public notify(): void {
    // Takes the newest error
    const oError = this.last();
    if (!oError) return;

    // Shows it until it is closed, and leaves its store
    notifications.show({ color: 'red', message: oError.message, autoClose: false });
    this.dismiss();
  }
}

/** Renders nothing: it turns every new error into a notification */
export default createView(NotifyErrorController, errors => {
  useEffect(errors.notify, [errors.last()]);
  return null;
});

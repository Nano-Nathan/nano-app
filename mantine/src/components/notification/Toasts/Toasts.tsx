'use client';

import { useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import { createView } from '@nano-app/frontend';
import ToastsController from './Toasts.controller';

/** Mantine's notifications, with every failed request of the api stores among them */
export default createView(ToastsController, (toasts, props) => {
  useEffect(toasts.show, [toasts.items()]);
  return <Notifications position="top-right" autoClose={3000} {...props} />;
});

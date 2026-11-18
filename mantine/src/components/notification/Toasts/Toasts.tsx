'use client';

import { useEffect } from 'react';
import { Notifications as MantineNotifications } from '@mantine/notifications';
import { createView } from '@nano-app/frontend';
import ToastsController from './Toasts.controller';

/** Mantine's notifications, fed by the notifications of the app */
export default createView(
  ToastsController,
  (toasts, { types: _aTypes, colors: _oColors, ...oProps }) => {
    useEffect(toasts.show, [toasts.items(), toasts.errors().length]);
    return <MantineNotifications position="top-center" autoClose={3000} {...oProps} />;
  },
);

'use client';

import { useEffect } from 'react';
import { NavigationProgress, nprogress } from '@mantine/nprogress';
import { ProgressController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';

/** A thin bar at the top of the screen while a request of any api store is out or a page is on its way */
export default createView(ProgressController, (progress, props) => {
  // The page arrived when the path changes; the bar follows whether the app waits
  useEffect(progress.arrive, [progress.pathname]);
  useEffect(() => progress.sync(nprogress), [progress.isActive()]);
  return <NavigationProgress {...props} />;
});

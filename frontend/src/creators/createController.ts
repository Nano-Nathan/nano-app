'use client';

import { enableStaticRendering, observer } from 'mobx-react-lite';
import { useStores } from '../react/NanoAppProvider';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { ComponentContext, ComponentProps, Controller } from '../types/component';

// The server renders each component once: no MobX subscriptions there
enableStaticRendering(typeof window === 'undefined');

/** Creates a controller: methods on the stores and the props, for the views bound to it */
export default function createController<M extends NanoObject>(
  fnMethods: (context: ComponentContext) => M,
): Controller<M> {
  return {
    // Each bound view is a component that re-renders when a store path it read changes
    bindView: fnView =>
      observer((oProps: ComponentProps) => {
        // Gives the methods the props and the stores
        const oContext = { props: oProps, stores: useStores() };

        // Renders the view with the methods; the context wins over a method with its name
        return fnView({ ...fnMethods(oContext), ...oContext });
      }),
  };
}

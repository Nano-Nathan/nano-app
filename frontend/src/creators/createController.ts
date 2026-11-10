'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { enableStaticRendering, observer } from 'mobx-react-lite';
import { IS_SERVER } from '@nano-app/core/const';
import { useStores } from '../react/NanoAppProvider';
import type { NanoObject } from '@nano-app/core/types/objects';
import type {
  ComponentContext,
  ComponentProps,
  Controller,
  ControllerCallbacks,
} from '../types/component';

// The server renders each component once: no MobX subscriptions there
enableStaticRendering(IS_SERVER);

/** Creates a controller: methods on the stores and the props, for the views bound to it */
export default function createController<
  M extends NanoObject & { callbacks?: ControllerCallbacks },
>(fnMethods: (context: ComponentContext) => M & { callbacks?: ThisType<M> }): Controller<M> {
  return controller(fnMethods);
}

/** A controller of these methods, with `this` of its callbacks left to `createController` */
function controller<M extends NanoObject & { callbacks?: ControllerCallbacks }>(
  fnMethods: (context: ComponentContext) => M,
): Controller<M> {
  return {
    // Each bound view is a component that re-renders when a store path it read changes
    bindView: fnView =>
      observer((oProps: ComponentProps) => {
        // Gives the methods the props, the stores and the router of the app
        const oContext = { props: oProps, stores: useStores(), router: useRouter() };
        const oMethods = fnMethods(oContext);

        // Binds each method to the others, so `this` reaches them also when the view calls it alone
        const oBound: NanoObject = {};
        for (const [sName, oMethod] of Object.entries(oMethods)) {
          if (typeof oMethod === 'function') oBound[sName] = oMethod.bind(oMethods);
        }

        // Runs onMount once when the view mounts, and onUnmount when it unmounts
        useEffect(() => {
          oMethods.callbacks?.onMount?.call(oMethods);
          return () => {
            oMethods.callbacks?.onUnmount?.call(oMethods);
          };
        }, []);

        // Renders the view with the methods; the context wins over a method with its name
        return fnView({ ...oMethods, ...oBound, ...oContext });
      }),
    // A new controller with its methods merged over these, and both callbacks run in order
    extend: fnExtension =>
      controller(oContext => {
        const oOwn = fnMethods(oContext);
        const oExtension = fnExtension(oContext);
        return {
          ...oOwn,
          ...oExtension,
          callbacks: {
            onMount(): void {
              oOwn.callbacks?.onMount?.call(this);
              oExtension.callbacks?.onMount?.call(this);
            },
            onUnmount(): void {
              oOwn.callbacks?.onUnmount?.call(this);
              oExtension.callbacks?.onUnmount?.call(this);
            },
          },
        };
      }),
  };
}

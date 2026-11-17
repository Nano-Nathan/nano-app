'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { useStores } from '../app/NanoAppProvider';
import type { ReactNode } from 'react';
import type Controller from '../controllers/Controller';
import type { ComponentContext, ComponentProps, View } from '../types/component';

/** Creates a component: a view with its own instance of the controller per mount */
export default function createView<C extends Controller>(
  ControllerClass: new (context: ComponentContext) => C,
  fnView: View<C>,
): (props: ComponentProps) => ReactNode {
  // Re-renders when a store path the view read changes
  return observer((props: ComponentProps) => {
    // Creates the controller once, with the context of the view
    const stores = useStores();
    const router = useRouter();
    const [oController] = useState(() => new ControllerClass({ props, stores, router }));

    // Gives the methods the props of the last render on screen
    useLayoutEffect(() => {
      oController.props = props;
    });

    // Runs onMount when the view mounts and onUnmount when it unmounts
    useEffect(() => {
      oController.onMount();
      return () => oController.onUnmount();
    }, [oController]);

    // Renders the view with the props of this render
    return fnView(oController, props);
  });
}

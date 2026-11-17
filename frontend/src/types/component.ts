import type { ReactNode } from 'react';
import type { useRouter } from 'next/navigation';
import type { NanoObject } from '@nano-app/core/types/objects';
import type Controller from '../controllers/Controller';
import type { Stores } from './store';

/** Props a component receives from its parent */
export type ComponentProps = NanoObject<any>;

/** What a controller and its views receive: the props, the stores and Next's router */
export type ComponentContext = {
  props: ComponentProps;
  stores: Stores;
  router: ReturnType<typeof useRouter>;
};

/** Renders a component with its controller and the props of this render */
export type View<C extends Controller> = (controller: C, props: ComponentProps) => ReactNode;

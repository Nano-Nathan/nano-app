import type { ReactNode } from 'react';
import type { useRouter } from 'next/navigation';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { Stores } from './store';

/** Props a component receives from its parent */
// any: the props are the consumer's, unknown to the framework
export type ComponentProps = NanoObject<any>;

/** What a controller and its views receive: the props, the stores and Next's router */
export type ComponentContext = {
  props: ComponentProps;
  stores: Stores;
  router: ReturnType<typeof useRouter>;
};

/** Callbacks of a controller, run by each view bound to it */
export type ControllerCallbacks = {
  /** Run once, when the view mounts */
  onMount?(): unknown;
};

/** Renders a component with the controller's methods; the context wins over a method's name */
export type View<M extends NanoObject> = (
  params: Omit<M, keyof ComponentContext> & ComponentContext,
) => ReactNode;

/** Returned by `createController`: binds views to its methods */
export type Controller<M extends NanoObject> = {
  /** Creates a component that renders the view with the controller's methods */
  bindView(view: View<M>): (props: ComponentProps) => ReactNode;
  /** Creates a controller with these methods merged over its own: a method with the same name wins, and both `onMount` run */
  extend<E extends NanoObject>(
    methods: (context: ComponentContext) => E,
  ): Controller<Omit<M, keyof E> & E>;
};

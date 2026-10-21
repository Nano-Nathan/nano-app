import type { ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { Stores } from './store';

/** Props a component receives from its parent */
// any: the props are the consumer's, unknown to the framework
export type ComponentProps = NanoObject<any>;

/** What a controller and its views receive: the props and the stores */
export type ComponentContext = { props: ComponentProps; stores: Stores };

/** Renders a component with the controller's methods; the context wins over a method's name */
export type View<M extends NanoObject> = (
  params: Omit<M, keyof ComponentContext> & ComponentContext,
) => ReactNode;

/** Returned by `createController`: binds views to its methods */
export type Controller<M extends NanoObject> = {
  /** Creates a component that renders the view with the controller's methods */
  bindView(view: View<M>): (props: ComponentProps) => ReactNode;
};

# State and controllers

The frontend splits a screen in three parts: the **stores** hold the state, the **controllers** hold the logic, and the **views** render.

## Stores

A store is a tree of plain values that every view of the app shares. Code reads and writes it by path: `get('/drawer/isOpen')`, `set('/drawer/isOpen', true)`.

- An `app` store holds UI state.
- An `api` store also talks to one backend. Its reads are kept in its tree, at their path and query, so a read is state too.

Each React tree gets its own copy of the stores, so two users on one server never share state.

## Controllers

A controller is a class with the logic of one view. It reaches the stores, the view's props, Next's router and the current path with `this`.

- `onMount` loads what the view needs. `onUnmount` cleans up.
- Every method is bound once per mount, so a view can pass it alone to an event.
- Behavior is changed by extending: `class X extends AuthController`, with the original through `super`.

The logic stays out of the view, so it can be extended, reused by several views, and read without JSX around it.

## Views

`createView(Controller, view)` makes the component. The view gets its controller and the props of the render, and renders.

A view renders again only when a store path it read changes. There are no selectors and no dependency lists to keep: what the view reads is what it subscribes to.

A view has no hooks of its own, except one `useEffect` that calls a controller method when a value changes.

## Why not hooks

Hooks put the state, the logic and the rendering in one function. A class keeps the logic in methods that can be named, extended and overridden, and leaves the view as a plain render. The framework's ready controllers depend on this: an app changes one method of `AuthController` without copying the rest.

## Design decisions

- The browser never talks to the backend: only the Next server does, and the backend URL never reaches the client bundle.
- The frontend has no credential of its own and depends on no backend plugin. What the backend exposes, and how it is protected, is decided in the backend.
- No `glob` or `jiti` in the client bundle, and no generated files in `node_modules`: build data goes through Next's `compiler.define`, and the stores' types through `nano-app-env.d.ts` in the app.
- Decided against, not coming back: typed store paths (a store's shape changes with the app's flow), `useStore`, `createComponent`, `StoreManager`, a guard against `set` during render, and a server-only mode of the creator.
- Not yet, until real controllers ask for it: `onInit` in the controller, a debounce of the framework, dropping old reads, reading what other users change, `PATCH`, and the React Compiler.

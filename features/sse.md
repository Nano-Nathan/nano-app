---
status: todo
owner: null
depends_on: []
updated: 2026-10-25
---

# Server-sent events

Not tied to a milestone: taken only when the maintainer asks.

## Goal

The backend pushes events to the frontend over plain HTTP: an endpoint that stays open, and an emitter any route can call.

## Scope

- In the backend (`@nano-app/backend`), not a plugin: the endpoint holds the socket and writes over time, while a handler returns an `ApiResponse` and never touches `res`, so the framework registers it directly, like the error handler.
- `GET /events?channels=orders,alerts`: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`, a heartbeat comment every N seconds, removal from the registry on `close`.
- A process-level emitter, importable from any route:

  ```ts
  import { events } from '@nano-app/backend';

  events.emit('orders', { type: 'created', id });
  events.clients('orders');
  ```

  In-memory registry of open connections by channel; data serialized with `JSON.stringify`, in the `ApiResponse` shape when it applies.
- The client side in `@nano-app/frontend` (`EventSource` behind a store). It goes through the frontend proxy (`@nano-app/frontend/proxy`), since the browser never talks to the backend.
- Gotcha: `compression` buffers and breaks SSE; exclude `text/event-stream` in its `filter`. Test this first.
- To decide with the maintainer: how a stream authenticates.

## Out of scope

WebSockets (the emitter's API should not assume they will never exist). Guaranteed delivery: `Last-Event-ID` replays only while the buffer holds the event.

## Done when

A component of the test app updates with an event sent by the backend.

## Log

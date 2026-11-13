import { createPluginCallbacks, createRoute } from '../../src';

// Type tests: `tsc` fails when a line marked `@ts-expect-error` stops being an error

/** What a test app injects in its params */
type AppDeps = { db: { note: { count: () => Promise<number> } }; title: string };

createRoute<AppDeps>({
  GET: async (_oReq, { db, title, session }) => ({
    result: { count: await db.note.count(), title, user: session?.user },
  }),
  // @ts-expect-error a handler receives only what the app injects
  POST: async (_oReq, { missing }) => ({ result: missing }),
});

createRoute<AppDeps>({
  callbacks: {
    // @ts-expect-error a callback receives only what the app injects
    onInit: async ({ missing }) => missing,
  },
});

createPluginCallbacks<AppDeps>({
  // @ts-expect-error a plugin callback receives only what the plugin injects
  onMount: async ({ db }) => db.missing(),
});

// Without `Deps`, the params take anything the app injects
createRoute({ GET: async (_oReq, { anything }) => ({ result: anything }) });

import { registerHooks } from 'node:module';

// Node does not load CSS: Mantine's styles, imported by the layout, load as an empty module
registerHooks({
  load: (sUrl, oContext, fnNext) =>
    sUrl.endsWith('.css')
      ? { format: 'module', source: '', shortCircuit: true }
      : fnNext(sUrl, oContext),
});

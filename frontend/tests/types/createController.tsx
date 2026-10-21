import createController from '../../src/creators/createController';

// Type tests: `tsc` fails when a line marked `@ts-expect-error` stops being an error

const oController = createController(() => ({ inc: (iStep: number) => iStep }));

oController.bindView(({ inc }) => {
  // @ts-expect-error the view calls a method with its own argument types
  inc('x');
  return null;
});

oController.bindView(oParams => {
  // @ts-expect-error the view has only the methods that exist
  oParams.missing();
  return null;
});

createController(() => ({ stores: () => 1 })).bindView(({ stores }) => {
  // @ts-expect-error the context wins over a method with its name
  stores();
  return null;
});

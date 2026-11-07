import createController from '../../src/creators/createController';

// Type tests: `tsc` fails when a line marked `@ts-expect-error` stops being an error

const oController = createController(() => ({
  inc(iStep: number): number {
    return iStep;
  },
}));

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

createController(() => ({
  stores(): number {
    return 1;
  },
})).bindView(({ stores }) => {
  // @ts-expect-error the context wins over a method with its name
  stores();
  return null;
});

oController
  .extend(() => ({
    dec(iStep: number): number {
      return -iStep;
    },
  }))
  .bindView(({ inc, dec }) => {
    // @ts-expect-error an extended controller keeps the types of its methods and the new ones
    inc(dec('x'));
    return null;
  });

oController.extend(() => ({
  twice(): number {
    // @ts-expect-error an extension reaches the controller's methods with `this`, with their types
    return this.inc('x');
  },
}));

oController
  .extend(() => ({
    inc(sText: string): string {
      return sText;
    },
  }))
  .bindView(({ inc }) => {
    // @ts-expect-error a method replaced by extend takes the new types
    inc(1);
    return null;
  });

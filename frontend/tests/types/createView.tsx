import Controller from '../../src/controllers/Controller';
import createView from '../../src/creators/createView';

// Type tests: `tsc` fails when a line marked `@ts-expect-error` stops being an error

/** Controller with one method that takes a number */
class StepController extends Controller {
  public inc(iStep: number): number {
    return iStep;
  }
}

createView(StepController, step => {
  // @ts-expect-error the view calls a method with its own argument types
  step.inc('x');
  return null;
});

createView(StepController, step => {
  // @ts-expect-error the view has only the methods that exist
  step.missing();
  return null;
});

createView(StepController, step => {
  // @ts-expect-error a store the app does not have is a type error
  return step.stores.missing;
});

class ReplacedController extends StepController {
  public inc(iStep: number): number {
    // @ts-expect-error a subclass reaches the original with super, with its types
    return super.inc(String(iStep));
  }
}
createView(ReplacedController, () => null);

/** Controller whose constructor does not take the view's context */
class OwnController extends Controller {
  constructor(sName: string) {
    super({ props: { sName }, stores: {} as never, router: {} as never, pathname: '/' });
  }
}

// @ts-expect-error a controller must take the view's context
createView(OwnController, () => null);

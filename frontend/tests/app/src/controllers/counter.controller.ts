import { createController } from '@nano-app/frontend';

/** Methods of the counter: they write the app store */
export default createController(({ stores: { app } }) => ({
  increment: () => app.set('/iCount', app.get('/iCount') + 1),
  update: (iValue: number) => app.set('/iCount', app.get('/iCount') + iValue),
}));

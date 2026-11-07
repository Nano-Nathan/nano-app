import { createController } from '@nano-app/frontend';

/** Methods of the counter: they write the app store */
export default createController(({ stores: { app } }) => ({
  increment(): void {
    // Adds one
    app.set('/iCount', app.get('/iCount') + 1);
  },
  update(iValue: number): void {
    // Adds the value
    app.set('/iCount', app.get('/iCount') + iValue);
  },
}));

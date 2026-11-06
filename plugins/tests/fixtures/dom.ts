import { GlobalRegistrator } from '@happy-dom/global-registrator';

/** Port of the app: the origin where the browser sends `/api/<store>` */
export const APP_PORT = 4300;

// A browser DOM on the app's origin, imported before the frontend, whose fetch reaches any origin
GlobalRegistrator.register({
  url: `http://localhost:${APP_PORT}`,
  settings: { fetch: { disableSameOriginPolicy: true } },
});

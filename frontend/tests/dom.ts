import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Gives the tests a browser DOM, on the origin of the test backend: imported before React and Testing Library
GlobalRegistrator.register({ url: 'http://localhost:4200' });

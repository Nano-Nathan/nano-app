import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Gives the tests a browser DOM: imported before React and Testing Library
GlobalRegistrator.register();

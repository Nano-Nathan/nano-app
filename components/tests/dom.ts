import { GlobalRegistrator } from '@happy-dom/global-registrator';

// A browser DOM on the test backend's origin: imported before React and Testing Library
GlobalRegistrator.register({ url: 'http://localhost:4201' });

import { GlobalRegistrator } from '@happy-dom/global-registrator';

// A browser DOM on the origin of the test backend: imported before React and Testing Library
GlobalRegistrator.register({ url: 'http://localhost:4202' });

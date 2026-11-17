'use client';

import { createView } from '@nano-app/frontend';
import CounterController from '../controllers/counter.controller';

/** Counter of the app store */
export default createView(CounterController, counter => (
  <div>
    <button onClick={() => counter.update(-1)}>−</button>
    <output>{counter.stores.app.get('/iCount')}</output>
    <button onClick={counter.increment}>+</button>
  </div>
));

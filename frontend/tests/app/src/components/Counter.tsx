'use client';

import counterController from '../controllers/counter.controller';

/** Counter of the app store */
export default counterController.bindView(({ stores: { app }, increment, update }) => (
  <div>
    <button onClick={() => update(-1)}>−</button>
    <output>{app.get('/iCount')}</output>
    <button onClick={increment}>+</button>
  </div>
));

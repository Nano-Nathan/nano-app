import { createNanoApp } from '@nano-app/backend';
import health from '@nano-app/plugins/health';

// The app on :3000, with GET /health for the probes
createNanoApp({ plugins: { before: [health()] } });

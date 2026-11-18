import { existsSync } from 'node:fs';
import { withNanoApp } from '@nano-app/frontend/next';

/** Env file of the repository; absent in the Docker image, where the container sets the env */
const ENV_FILE = '../.env';

// Next only reads env files of its own folder: load the one of the root
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

export default withNanoApp({ output: 'standalone' });

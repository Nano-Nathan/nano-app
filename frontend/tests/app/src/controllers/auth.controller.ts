import auth from '@nano-app/components/auth';

/** Session of the backend store, shared by the login, the session and the private layout */
export default auth({ store: 'backend' });

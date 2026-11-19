# Sign in with Google

Use this to add a "Continue with Google" button to the login page. Other providers of Better Auth work the same way.

## Configure the provider in the backend

```ts
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

createNanoApp({
  auth: {
    emailAndPassword: { enabled: true },
    socialProviders: {
      google: {
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        redirectURI: GOOGLE_REDIRECT_URI,
      },
    },
  },
});
```

`redirectURI` goes through the proxy of the frontend, so the session cookie stays on the app's domain:

```bash
GOOGLE_REDIRECT_URI=https://app.example.com/api/api/auth/callback/google
```

Register that same URL in the Google Cloud console.

## Add the button

```tsx
// src/app/login/page.tsx
import { createLoginPage } from '@nano-app/mantine/server';

export default createLoginPage({ providers: ['google'] });
```

The button sends the user to Google, which comes back to `home` (`/` by default).

## Only users that exist

For an app where an admin creates the users, close sign-up in both places:

```ts
emailAndPassword: { enabled: true, disableSignUp: true },
socialProviders: { google: { /* … */ disableSignUp: true } },
```

```tsx
export default createLoginPage({ providers: ['google'], signUp: false });
```

A Google account with no user comes back to the login with the error `nano.auth.signup_disabled` as a toast.

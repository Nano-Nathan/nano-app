import { Container, Stack } from '@mantine/core';
import Login from './Login';
import type { ReactNode } from 'react';
import type { LoginOptions, LoginTexts } from '../../types/login';

/** English texts of the login */
const TEXTS: LoginTexts = {
  title: 'Welcome',
  subtitle: 'Sign in to continue',
  divider: 'or with your email',
  noAccount: 'No account yet?',
  haveAccount: 'Already have an account?',
  email: 'Email',
  password: 'Password',
  submit: 'Sign in',
  register: 'Create account',
  invalidEmail: 'Invalid email',
  required: 'Required',
  google: 'Continue with Google',
};

/** Login page: signs in or signs up at the store's Better Auth and goes to `home` */
export default function createLoginPage(oOptions: LoginOptions): () => ReactNode {
  const { store, home, providers = [], texts } = oOptions;
  return function LoginPage(): ReactNode {
    // The login in the middle of the screen, with the given texts over the English ones
    return (
      <Container size="xs">
        <Stack justify="center" mih="100dvh" py="xl">
          <Login store={store} home={home} providers={providers} texts={{ ...TEXTS, ...texts }} />
        </Stack>
      </Container>
    );
  };
}

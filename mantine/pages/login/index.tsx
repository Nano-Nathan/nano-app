import { Container } from '@mantine/core';
import Login from './Login';
import type { ReactNode } from 'react';
import type { LoginOptions, LoginTexts } from '../../types/login';

/** English texts of the login */
const TEXTS: LoginTexts = {
  title: 'Sign in',
  email: 'Email',
  password: 'Password',
  submit: 'Sign in',
  register: 'Create account',
  invalidEmail: 'Invalid email',
  required: 'Required',
};

/** Login page: signs in or signs up at the store's Better Auth and goes to `home` */
export default function createLoginPage(oOptions: LoginOptions): () => ReactNode {
  const { store, home, texts } = oOptions;
  return function LoginPage(): ReactNode {
    // The login with the given texts over the English ones
    return (
      <Container size="xs" py="xl">
        <Login store={store} home={home} texts={{ ...TEXTS, ...texts }} />
      </Container>
    );
  };
}

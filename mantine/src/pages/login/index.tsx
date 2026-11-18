import { Container, Stack } from '@mantine/core';
import Login from './Login';
import type { ReactNode } from 'react';
import type { LoginOptions } from '../../types/login';

/** Login page: signs in or signs up at Better Auth of the `api` store and goes to `home` */
export default function createLoginPage(oOptions: LoginOptions): () => ReactNode {
  const { home, providers = [], signUp = true, fields, signUpFields } = oOptions;
  return function LoginPage(): ReactNode {
    // The login in the middle of the screen
    return (
      <Container size="xs">
        <Stack justify="center" mih="100dvh" py="xl">
          <Login
            home={home}
            providers={providers}
            signUp={signUp}
            fields={fields}
            signUpFields={signUpFields}
          />
        </Stack>
      </Container>
    );
  };
}

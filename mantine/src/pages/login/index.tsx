import { Container, Stack } from '@mantine/core';
import { createPage } from '@nano-app/frontend/server';
import Login from './Login';
import type { ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { LoginOptions } from '../../types/login';

/** Login page: signs in or signs up at Better Auth of the `api` store and goes to `home`, at once with a session */
export default function createLoginPage(
  oOptions: LoginOptions,
): (props: NanoObject) => Promise<ReactNode> {
  const { home = '/', providers = [], signUp = true, fields, signUpFields } = oOptions;
  return createPage<NanoObject>({ auth: false, redirect: home }, () => (
    // The login in the middle of the screen
    <Container size="xs">
      <Stack justify="center" mih="100svh" py="xl">
        <Login
          home={home}
          providers={providers}
          signUp={signUp}
          fields={fields}
          signUpFields={signUpFields}
        />
      </Stack>
    </Container>
  ));
}

'use client';

import { Anchor, Button, Divider, Paper, Stack, Text, Title } from '@mantine/core';
import { z } from 'zod';
import { LoginController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { Form } from '../../components/input';
import GoogleIcon from './components/GoogleIcon';
import type { LoginProvider } from '../../types/login';

/** Key of each text of a mode: its button, and the question and link to the other mode */
const MODES = {
  signIn: { submit: 'submit', question: 'noAccount', link: 'register' },
  signUp: { submit: 'register', question: 'haveAccount', link: 'submit' },
} as const;

/** Login card: the providers, the form of email and password, and the link to the other mode */
export default createView(LoginController, (auth, { providers, signUp, texts }) => {
  // The keys of the texts of the current mode
  const oMode = auth.isSignUp() ? MODES.signUp : MODES.signIn;
  return (
    <Paper withBorder shadow="md" radius="lg" p={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <Stack gap="xs" align="center">
          <Title order={2} ta="center">
            {texts.title}
          </Title>
          <Text c="dimmed" ta="center">
            {texts.subtitle}
          </Text>
        </Stack>
        {providers.length > 0 && (
          <>
            {providers.map((sProvider: LoginProvider) => (
              <Button
                key={sProvider}
                variant="default"
                radius="xl"
                size="md"
                leftSection={<GoogleIcon />}
                disabled={auth.isBusy()}
                onClick={() => auth.social(sProvider)}
              >
                {texts[sProvider]}
              </Button>
            ))}
            <Divider label={texts.divider} labelPosition="center" />
          </>
        )}
        <Form
          name="login"
          fields={[
            {
              name: 'email',
              label: texts.email,
              type: 'email',
              validation: z.email(texts.invalidEmail),
            },
            {
              name: 'password',
              label: texts.password,
              type: 'password',
              validation: z.string(texts.required),
            },
          ]}
          onSubmit={auth.send}
        >
          <Button type="submit" radius="xl" size="md" mt="xs" loading={auth.isBusy()}>
            {texts[oMode.submit]}
          </Button>
        </Form>
        {signUp && (
          <Text size="sm" c="dimmed" ta="center">
            {texts[oMode.question]}{' '}
            <Anchor component="button" type="button" size="sm" fw={600} onClick={auth.toggle}>
              {texts[oMode.link]}
            </Anchor>
          </Text>
        )}
      </Stack>
    </Paper>
  );
});

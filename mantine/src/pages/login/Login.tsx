'use client';

import { Anchor, Button, Divider, Paper, Stack, Text, Title } from '@mantine/core';
import { AuthController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { Form } from '../../components/input';
import { LOGIN_FIELDS, LOGIN_MODES } from '../../const';
import GoogleIcon from './components/GoogleIcon';
import type { LoginProvider } from '../../types/login';

/** Login card: the providers, the form of the current mode, and the link to the other mode */
export default createView(
  AuthController,
  (auth, { providers, signUp, fields = LOGIN_FIELDS, signUpFields = fields }) => {
    // The keys of the texts and the fields of the current mode
    const oMode = auth.isToggled()
      ? { ...LOGIN_MODES.signUp, fields: signUpFields }
      : { ...LOGIN_MODES.signIn, fields };
    return (
      <Paper withBorder shadow="md" radius="lg" p={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Title order={2} ta="center">
              {auth.text('nano.login.title')}
            </Title>
            <Text c="dimmed" ta="center">
              {auth.text('nano.login.subtitle')}
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
                  onClick={() => auth.signIn({ provider: sProvider }, 'social')}
                >
                  {auth.text(`nano.login.${sProvider}`)}
                </Button>
              ))}
              <Divider label={auth.text('nano.login.divider')} labelPosition="center" />
            </>
          )}
          <Form name="login" fields={oMode.fields} onSubmit={auth.send}>
            <Button type="submit" radius="xl" size="md" mt="xs" loading={auth.isBusy()}>
              {auth.text(`nano.login.${oMode.submit}`)}
            </Button>
          </Form>
          {signUp && (
            <Text size="sm" c="dimmed" ta="center">
              {auth.text(`nano.login.${oMode.question}`)}{' '}
              <Anchor component="button" type="button" size="sm" fw={600} onClick={auth.toggle}>
                {auth.text(`nano.login.${oMode.link}`)}
              </Anchor>
            </Text>
          )}
        </Stack>
      </Paper>
    );
  },
);

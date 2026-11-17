'use client';

import { Anchor, Button, Divider, Paper, Stack, Text, Title } from '@mantine/core';
import { z } from 'zod';
import { createView } from '@nano-app/frontend';
import Form from '../../components/form';
import GoogleIcon from './components/GoogleIcon';
import LoginController from './LoginController';
import type { LoginProvider } from '../../types/login';

/** Login card: the providers, the form of email and password, and the link to the other mode */
export default createView(LoginController, (auth, { providers, signUp, texts }) => (
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
        <Button type="submit" radius="xl" size="md" mt="xs">
          {auth.mode().submit}
        </Button>
      </Form>
      {signUp && (
        <Text size="sm" c="dimmed" ta="center">
          {auth.mode().question}{' '}
          <Anchor component="button" type="button" size="sm" fw={600} onClick={auth.toggle}>
            {auth.mode().link}
          </Anchor>
        </Text>
      )}
    </Stack>
  </Paper>
));

'use client';

import { Anchor, Button, Divider, Paper, Stack, Text, Title } from '@mantine/core';
import { z } from 'zod';
import { createView } from '@nano-app/frontend';
import AuthController from '@nano-app/components/auth';
import NanoError from '@nano-app/core/utils/NanoError';
import Form from '../../components/form';
import GoogleIcon from './GoogleIcon';
import type { ApiStore } from '@nano-app/frontend';
import type { ApiResponse } from '@nano-app/core/types/api';
import type { LoginProvider } from '../../types/login';

/** Values of the login form */
type LoginValues = {
  email: string;
  password: string;
};

/** Auth of the store of the props: signs in or signs up and goes to the home */
class LoginController extends AuthController {
  protected api: ApiStore = this.store();

  /** Signs in with the values of the form and goes to the home */
  public async login(oValues: LoginValues): Promise<void> {
    const oResponse = await this.signIn(oValues);
    if (oResponse.success) this.navTo(this.props.home);
  }

  /** Signs up with the values of the form, the email as the name, and goes to the home */
  public async register(): Promise<void> {
    // Values of the login form
    const oValues: LoginValues = this.stores.app.get('/form/login/values');

    // Signs up and goes to the home
    const oResponse = await this.signUp({ ...oValues, name: oValues.email });
    if (oResponse.success) this.navTo(this.props.home);
  }

  /** Signs in with a provider: its page, then back to the home */
  public async social(sProvider: LoginProvider): Promise<void> {
    // Asks Better Auth the provider's page, back to the home
    const { success, url }: ApiResponse & { url?: string } = await this.signIn(
      { provider: sProvider, callbackURL: this.props.home },
      'social',
    );

    // Goes to the provider's page, outside the app
    if (success && url) window.location.assign(url);
  }

  /** The api store of the props; fails when the app has none of that name */
  private store(): ApiStore {
    const { store } = this.props;
    const oStore: ApiStore | undefined = Reflect.get(this.stores, store);
    if (!oStore)
      throw new NanoError(
        `The login asks the store "${store}", which the app does not have. Add src/stores/${store}.store.ts with type 'api'.`,
      );
    return oStore;
  }
}

/** Login card: the providers, the form of email and password, and the link that signs up */
export default createView(LoginController, (auth, { providers, texts }) => (
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
        onSubmit={auth.login}
      >
        <Button type="submit" radius="xl" size="md" mt="xs">
          {texts.submit}
        </Button>
      </Form>
      <Text size="sm" c="dimmed" ta="center">
        {texts.noAccount}{' '}
        <Anchor component="button" type="button" size="sm" fw={600} onClick={auth.register}>
          {texts.register}
        </Anchor>
      </Text>
    </Stack>
  </Paper>
));

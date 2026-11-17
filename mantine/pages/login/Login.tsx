'use client';

import { Button, Card, Stack, Title } from '@mantine/core';
import { z } from 'zod';
import { createView } from '@nano-app/frontend';
import AuthController from '@nano-app/components/auth';
import NanoError from '@nano-app/core/utils/NanoError';
import Form from '../../components/form';
import type { ApiStore } from '@nano-app/frontend';

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

/** Login card: the form of email and password, the sign-in and the sign-up */
export default createView(LoginController, (auth, { texts }) => (
  <Card withBorder>
    <Stack>
      <Title order={2}>{texts.title}</Title>
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
        <Button type="submit">{texts.submit}</Button>
      </Form>
      <Button variant="outline" onClick={auth.register}>
        {texts.register}
      </Button>
    </Stack>
  </Card>
));

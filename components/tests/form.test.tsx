// First: Testing Library needs the DOM when it loads
import './dom';
import './env/form';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import field from '../field';
import form from '../form';
import TestApp from './provider';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/field';

// Views of the fields: a text and a checkbox, each with its form and name
const Input = field().bindView(({ props }) => (
  <output>{`text ${props.form}.${props.field.name}`}</output>
));
const Checkbox = field().bindView(({ props }) => (
  <output>{`checkbox ${props.form}.${props.field.name}`}</output>
));

// Fields of a sign-up: a text, a checkbox and an email without a view
const SIGN_UP: FormField[] = [
  { name: 'name' },
  { name: 'terms', type: 'checkbox' },
  { name: 'email', type: 'email' },
];

// Fields of a login: a required email and a number
const LOGIN: FormField[] = [
  { name: 'email', type: 'email', required: true },
  { name: 'age', type: 'number' },
];

// View of a field with an input and its error
const Field = field().bindView(({ props: { field: oField }, value, error, change }) => (
  <label>
    <input
      aria-label={oField.name}
      value={value() ?? ''}
      onChange={oEvent => change(oEvent.target.value)}
    />
    <output>{`${oField.name}: ${error() ?? 'ok'}`}</output>
  </label>
));

// Values each submit sent, and what each submit returned
const aSent: NanoObject[] = [];
const aReturned: unknown[] = [];

// Controller of the login: its onSubmit keeps the values and answers `sent`
const loginController = form({ components: { text: Field } }).extend(() => ({
  onSubmit(oValues: NanoObject): string {
    aSent.push(oValues);
    return 'sent';
  },
}));

// View of the login: its fields, a submit that keeps what it returns, and a reset
const Login = loginController.bindView(({ fields, submit, reset }) => (
  <form onSubmit={oEvent => aReturned.push(submit(oEvent))}>
    {fields()}
    <button>send</button>
    <button type="button" onClick={reset}>
      reset
    </button>
  </form>
));

/** Renders the login inside the provider */
function renderLogin(): void {
  render(
    <TestApp>
      <Login name="login" fields={LOGIN} />
    </TestApp>,
  );
}

/** Types a value in the input of a field */
function type(sName: string, sValue: string): void {
  fireEvent.change(screen.getByLabelText(sName), { target: { value: sValue } });
}

/** Error the view shows for a field */
function errorOf(sName: string): string | null {
  return screen.getByText(new RegExp(`^${sName}: `)).textContent;
}

afterEach(() => {
  // Unmounts the views and forgets what the submits sent and returned
  cleanup();
  aSent.length = 0;
  aReturned.length = 0;
});

describe('form', () => {
  test('fields renders the view of each type in order, and the one of text without its own', () => {
    // Renders a form with views for text and checkbox
    const Form = form({ components: { text: Input, checkbox: Checkbox } }).bindView(
      ({ fields }) => <form>{fields()}</form>,
    );
    render(
      <TestApp>
        <Form name="signUp" fields={SIGN_UP} />
      </TestApp>,
    );

    // Each field shows its view, in the order of the config
    const aShown = screen.getAllByRole('status').map(oOutput => oOutput.textContent);
    assert.deepEqual(aShown, ['text signUp.name', 'checkbox signUp.terms', 'text signUp.email']);
  });

  test('fields fails with the fix when a field has no view nor text', () => {
    // Renders a form with only the checkbox view
    const Form = form({ components: { checkbox: Checkbox } }).bindView(({ fields }) => (
      <form>{fields()}</form>
    ));

    // The first field without a view stops the render
    assert.throws(
      () =>
        render(
          <TestApp>
            <Form name="signUp" fields={SIGN_UP} />
          </TestApp>,
        ),
      {
        message:
          '[nano-app] [ERROR] Form "signUp": the field "name" of type "text" has no view, and components has no "text" view to show it. Add one: form({ components: { text: Input } }).',
      },
    );
  });

  test('submit validates every field, also the untouched ones, and does not send', () => {
    // Types a valid age and submits without the required email
    renderLogin();
    type('age', '30');
    fireEvent.click(screen.getByText('send'));

    // The email shows its error and nothing is sent
    assert.equal(errorOf('email'), 'email: Required');
    assert.deepEqual(aSent, []);
    assert.deepEqual(aReturned, [undefined]);
  });

  test('submit sends the kept values to onSubmit and returns what it returns', () => {
    // Types both fields and submits
    renderLogin();
    type('email', 'ana@mail.com');
    type('age', '30');
    fireEvent.click(screen.getByText('send'));

    // Sends the email and the age as a number, and returns the answer of onSubmit
    assert.deepEqual(aSent, [{ email: 'ana@mail.com', age: 30 }]);
    assert.deepEqual(aReturned, ['sent']);
  });

  test('reset empties the values and the errors', () => {
    // Types an age, submits to show the email's error, then resets
    renderLogin();
    type('age', '30');
    fireEvent.click(screen.getByText('send'));
    fireEvent.click(screen.getByText('reset'));

    // The inputs are empty and no field shows an error
    assert.equal(screen.getByLabelText<HTMLInputElement>('age').value, '');
    assert.equal(errorOf('email'), 'email: ok');
  });

  test('submit fails with the fix when the form has no onSubmit', () => {
    // A form without its own onSubmit, whose view calls submit when its button is clicked
    const Plain = form({ components: { text: Field } }).bindView(({ fields, submit }) => (
      <form>
        {fields()}
        <button type="button" onClick={submit}>
          send
        </button>
      </form>
    ));
    render(
      <TestApp>
        <Plain name="plain" fields={[{ name: 'nick' }]} />
      </TestApp>,
    );

    // Clicks it, keeping the error the browser reports
    const aReported: string[] = [];
    const fnReport = (oEvent: ErrorEvent) => {
      oEvent.preventDefault();
      aReported.push(oEvent.error.message);
    };
    window.addEventListener('error', fnReport);
    fireEvent.click(screen.getByText('send'));
    window.removeEventListener('error', fnReport);

    // Its submit threw the fix
    assert.deepEqual(aReported, [
      '[nano-app] [ERROR] Form "plain": it has no onSubmit. Add it: form({ components }).extend(() => ({ onSubmit(values) { … } })).',
    ]);
  });
});

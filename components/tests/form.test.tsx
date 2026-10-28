// First: Testing Library needs the DOM when it loads
import './dom';
import './env/form';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NanoAppProvider } from '@nano-app/frontend';
import field from '../field';
import form from '../form';
import type { ReactNode } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';
import type { FormField } from '../types/form';

// Values each submit sent
const aSent: NanoObject[] = [];

// Views of the fields: a text input and a checkbox, with the error of each
const Input = field().bindView(({ props: { field: oField }, value, error, change }) => (
  <label>
    {oField.label}
    <input
      aria-label={oField.name}
      value={value() ?? ''}
      onChange={oEvent => change(oEvent.target.value)}
    />
    <output>{`${oField.name}: ${error() ?? 'ok'}`}</output>
  </label>
));
const Checkbox = field().bindView(({ props: { field: oField }, value, error, change }) => (
  <label>
    <input
      type="checkbox"
      aria-label={oField.name}
      checked={value() ?? false}
      onChange={oEvent => change(oEvent.target.checked)}
    />
    <output>{`${oField.name}: ${error() ?? 'ok'}`}</output>
  </label>
));

// The view of the forms: its fields, a submit and a reset
const Form = form({ components: { text: Input, checkbox: Checkbox } }).bindView(
  ({ fields, submit, reset }) => (
    <form onSubmit={submit}>
      {fields()}
      <button>send</button>
      <button type="button" onClick={reset}>
        reset
      </button>
    </form>
  ),
);

// Fields of the sign-up: an email, a number, a password and its confirmation, and a checkbox
const SIGN_UP: FormField[] = [
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'age', type: 'number' },
  { name: 'password', type: 'password', required: true },
  {
    name: 'confirm',
    validate: (sConfirm, oValues) => (sConfirm === oValues.password ? undefined : 'Mismatch'),
  },
  { name: 'terms', type: 'checkbox', required: true },
];

/** Renders a node inside the provider */
function renderApp(oNode: ReactNode): void {
  render(<NanoAppProvider>{oNode}</NanoAppProvider>);
}

/** Types a value in the input of a field */
function type(sName: string, sValue: string): void {
  fireEvent.change(screen.getByLabelText(sName), { target: { value: sValue } });
}

/** Error the view shows for a field */
function errorOf(sName: string): string | null {
  return screen.getByText(new RegExp(`^${sName}: `)).textContent;
}

describe('form', () => {
  afterEach(() => {
    // Starts each test with a new tree and nothing sent
    cleanup();
    aSent.length = 0;
  });

  test('fields shows each field with the view of its type, or the one of text', () => {
    // Renders the sign-up
    renderApp(
      <Form
        name="signUp"
        fields={SIGN_UP}
        onSubmit={(oValues: NanoObject) => aSent.push(oValues)}
      />,
    );

    // The email, number, password and confirm use the text view, the terms the checkbox one; the other keys pass to the view
    assert.equal(screen.getByLabelText('password').getAttribute('type'), null);
    assert.equal(screen.getByLabelText('terms').getAttribute('type'), 'checkbox');
    assert.ok(screen.getByText('Email'));
  });

  test('change keeps the value and validates the field', () => {
    // Renders the sign-up and types an invalid email, a valid one and a text in the number
    renderApp(<Form name="signUp" fields={SIGN_UP} onSubmit={() => {}} />);
    type('email', 'ana');
    assert.equal(errorOf('email'), 'email: Invalid email');
    type('email', 'ana@nano.app');
    assert.equal(errorOf('email'), 'email: ok');
    type('age', 'ten');
    assert.equal(errorOf('age'), 'age: Invalid number');

    // Empties a required field
    type('email', '');
    assert.equal(errorOf('email'), 'email: Required');
    assert.equal(screen.getByLabelText<HTMLInputElement>('age').value, 'ten');
  });

  test('submit validates every field and sends nothing while one breaks a rule', () => {
    // Renders the sign-up and sends it with a confirmation that does not match
    renderApp(
      <Form
        name="signUp"
        fields={SIGN_UP}
        onSubmit={(oValues: NanoObject) => aSent.push(oValues)}
      />,
    );
    type('password', 'secret');
    type('confirm', 'other');
    fireEvent.click(screen.getByText('send'));

    // The required ones, the own rule and the unchecked terms break; nothing is sent
    assert.equal(errorOf('email'), 'email: Required');
    assert.equal(errorOf('confirm'), 'confirm: Mismatch');
    assert.equal(errorOf('terms'), 'terms: Required');
    assert.equal(errorOf('age'), 'age: ok');
    assert.equal(aSent.length, 0);
  });

  test('submit calls onSubmit with the values when every field is valid', () => {
    // Renders the sign-up, fills it and sends it
    renderApp(
      <Form
        name="signUp"
        fields={SIGN_UP}
        onSubmit={(oValues: NanoObject) => aSent.push(oValues)}
      />,
    );
    type('email', 'ana@nano.app');
    type('age', '30');
    type('password', 'secret');
    type('confirm', 'secret');
    fireEvent.click(screen.getByLabelText('terms'));
    fireEvent.click(screen.getByText('send'));

    assert.deepEqual(
      { ...aSent[0] },
      {
        email: 'ana@nano.app',
        age: '30',
        password: 'secret',
        confirm: 'secret',
        terms: true,
      },
    );
  });

  test('reset empties the values and errors', () => {
    // Renders the sign-up, types an invalid email and resets it
    renderApp(<Form name="signUp" fields={SIGN_UP} onSubmit={() => {}} />);
    type('email', 'ana');
    fireEvent.click(screen.getByText('reset'));

    assert.equal(screen.getByLabelText<HTMLInputElement>('email').value, '');
    assert.equal(errorOf('email'), 'email: ok');
  });

  test('two forms keep their values apart, and messages replace the default ones', () => {
    // Renders two forms of a controller with its own messages
    const Spanish = form({
      components: { text: Input },
      messages: { required: 'Obligatorio' },
    }).bindView(({ fields }) => <div>{fields()}</div>);
    renderApp(
      <>
        <Spanish name="a" fields={[{ name: 'one', required: true }]} />
        <Spanish name="b" fields={[{ name: 'two', required: true }]} />
      </>,
    );

    // Types in one and empties it; the other keeps nothing
    type('one', 'x');
    type('one', '');
    assert.equal(errorOf('one'), 'one: Obligatorio');
    assert.equal(errorOf('two'), 'two: ok');
  });

  test('a field without a view for its type nor text fails', () => {
    // Renders a form without the text view
    const Bare = form({ components: { checkbox: Checkbox } }).bindView(({ fields }) => (
      <div>{fields()}</div>
    ));

    assert.throws(
      () => renderApp(<Bare name="bare" fields={[{ name: 'email', type: 'email' }]} />),
      /Form "bare": the field "email" has no component for "email" nor "text"/,
    );
  });
});

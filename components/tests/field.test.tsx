// First: Testing Library needs the DOM when it loads
import './dom';
import './env/field';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NanoAppProvider } from '@nano-app/frontend';
import field from '../field';
import { MESSAGES } from '../field/validate';
import type { FormField } from '../types/form';

// View of a field: a text input with its error
const Input = field().bindView(({ props: { field: oField }, value, error, change }) => (
  <label>
    <input
      aria-label={oField.name}
      value={value() ?? ''}
      onChange={oEvent => change(oEvent.target.value)}
    />
    <output>{`${oField.name}: ${error() ?? 'ok'}`}</output>
  </label>
));

// Fields of a sign-up: an email, a number, a password and its confirmation
const SIGN_UP: FormField[] = [
  { name: 'email', type: 'email', required: true },
  { name: 'age', type: 'number' },
  { name: 'password', type: 'password' },
  {
    name: 'confirm',
    validate: (sConfirm, oValues) => (sConfirm === oValues.password ? undefined : 'Mismatch'),
  },
];

/** Renders the fields of a form inside the provider */
function renderFields(sForm: string, aFields: FormField[]): void {
  render(
    <NanoAppProvider>
      {aFields.map(oField => (
        <Input key={oField.name} form={sForm} field={oField} messages={MESSAGES} />
      ))}
    </NanoAppProvider>,
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

describe('field', () => {
  afterEach(cleanup);

  test('change keeps the value and validates the email, the number and required', () => {
    // Renders the sign-up and types an invalid email, a valid one and a text in the number
    renderFields('signUp', SIGN_UP);
    type('email', 'ana');
    assert.equal(errorOf('email'), 'email: Invalid email');
    type('email', 'ana@nano.app');
    assert.equal(errorOf('email'), 'email: ok');
    type('age', 'ten');
    assert.equal(errorOf('age'), 'age: Invalid number');

    // Empties the required email; the number keeps its value
    type('email', '');
    assert.equal(errorOf('email'), 'email: Required');
    assert.equal(screen.getByLabelText<HTMLInputElement>('age').value, 'ten');
  });

  test('the own rule of a field receives the values of its form', () => {
    // Renders the sign-up and confirms another password
    renderFields('signUp', SIGN_UP);
    type('password', 'secret');
    type('confirm', 'other');
    assert.equal(errorOf('confirm'), 'confirm: Mismatch');

    // Confirms the same password
    type('confirm', 'secret');
    assert.equal(errorOf('confirm'), 'confirm: ok');
  });

  test('fields of two forms keep their values apart', () => {
    // Renders a required field in two forms of the same tree and types in one
    render(
      <NanoAppProvider>
        <Input form="a" field={{ name: 'one', required: true }} messages={MESSAGES} />
        <Input form="b" field={{ name: 'two', required: true }} messages={MESSAGES} />
      </NanoAppProvider>,
    );
    type('one', 'x');
    type('one', '');

    assert.equal(errorOf('one'), 'one: Required');
    assert.equal(errorOf('two'), 'two: ok');
  });
});

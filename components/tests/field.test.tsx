// First: Testing Library needs the DOM when it loads
import './dom';
import './env/field';
import { test, describe, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NanoAppProvider } from '@nano-app/frontend';
import field from '../field';
import type { FormField } from '../types/field';

const PORT = 4201;

// Backend behind the proxy: answers the roles of a select
const oBackend = createServer((_oReq, oRes) => {
  const aRoles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'User' },
  ];
  const sAnswer = JSON.stringify({ success: true, result: aRoles });
  oRes.writeHead(200, { 'content-type': 'application/json' }).end(sAnswer);
});

// View of a select: a button that loads its options and shows them
const Select = field().bindView(({ options, load }) => (
  <button onClick={() => load()}>
    {options()
      .map(oRole => `${oRole.id}:${oRole.name}`)
      .join(',')}
  </button>
));

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
  { name: 'phone', required: true, errorMessage: 'Your phone' },
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
        <Input key={oField.name} form={sForm} field={oField} />
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
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
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

  test('errorMessage replaces the message of the default rules', () => {
    // Renders the sign-up and empties the phone
    renderFields('signUp', SIGN_UP);
    type('phone', '1');
    type('phone', '');

    assert.equal(errorOf('phone'), 'phone: Your phone');
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
        <Input form="a" field={{ name: 'one', required: true }} />
        <Input form="b" field={{ name: 'two', required: true }} />
      </NanoAppProvider>,
    );
    type('one', 'x');
    type('one', '');

    assert.equal(errorOf('one'), 'one: Required');
    assert.equal(errorOf('two'), 'two: ok');
  });

  test('a number field keeps a number, and the text of one being typed', () => {
    // Renders a number field that shows the type of its value, and types a number and a part of one
    renderFields('pay', [
      { name: 'total', type: 'number', format: oValue => `${typeof oValue} ${oValue}` },
    ]);
    type('total', '12');
    assert.equal(screen.getByLabelText<HTMLInputElement>('total').value, 'number 12');
    type('total', '1.');
    assert.equal(screen.getByLabelText<HTMLInputElement>('total').value, 'string 1.');
  });

  test('format shows the value kept and parse keeps what the view gives', () => {
    // Renders a price shown with its sign and kept as a number, and types one
    const oPrice: FormField = {
      name: 'price',
      format: iPrice => `$${iPrice}`,
      parse: sPrice => Number(sPrice.replace('$', '')),
      validate: oValue => (typeof oValue === 'number' ? undefined : 'Text'),
    };
    renderFields('pay', [oPrice]);
    type('price', '$15');

    assert.equal(screen.getByLabelText<HTMLInputElement>('price').value, '$15');
    assert.equal(errorOf('price'), 'price: ok');
  });

  test('options are the items of their path, read by load', async () => {
    // Renders a select of roles: without a read it has none
    const oRole: FormField = { name: 'role', options: { path: '/roles' } };
    render(
      <NanoAppProvider>
        <Select form="user" field={oRole} />
      </NanoAppProvider>,
    );
    assert.equal(screen.getByRole('button').textContent, '');

    // Loads the roles from the backend
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => assert.equal(screen.getByRole('button').textContent, '1:Admin,2:User'));
  });
});

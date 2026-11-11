// First: Testing Library needs the DOM when it loads
import './dom';
import './env/field';
import { test, describe, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { z } from 'zod';
import field from '../field';
import TestApp from './provider';
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

// View of a select: shows its options
const Select = field().bindView(({ options }) => (
  <output>
    {options()
      .map(oRole => `${oRole.id}:${oRole.name}`)
      .join(',')}
  </output>
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

// Fields of a sign-up, each with its validation: an email, a phone and an optional number
const SIGN_UP: FormField[] = [
  { name: 'email', validation: z.email('Invalid email') },
  { name: 'phone', validation: z.string('Required') },
  { name: 'age', type: 'number', validation: z.number('Invalid number').optional() },
];

/** Renders the fields of a form inside the provider */
function renderFields(sForm: string, aFields: FormField[]): void {
  render(
    <TestApp>
      {aFields.map(oField => (
        <Input key={oField.name} form={sForm} field={oField} />
      ))}
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

describe('field', () => {
  before(() => new Promise<void>(fnResolve => oBackend.listen(PORT, fnResolve)));
  after(() => oBackend.close());
  afterEach(cleanup);

  test('change keeps the value and shows the message of the first rule of its validation it breaks', () => {
    // Renders the sign-up and types an invalid email, a valid one and a text in the number
    renderFields('signUp', SIGN_UP);
    type('email', 'ana');
    assert.equal(errorOf('email'), 'email: Invalid email');
    type('email', 'ana@nano.app');
    assert.equal(errorOf('email'), 'email: ok');
    type('age', 'ten');
    assert.equal(errorOf('age'), 'age: Invalid number');

    // The untouched phone shows no error, and the number keeps its value
    assert.equal(errorOf('phone'), 'phone: ok');
    assert.equal(screen.getByLabelText<HTMLInputElement>('age').value, 'ten');
  });

  test('an empty text is no value: only a field whose validation needs one breaks', () => {
    // Renders the sign-up, and types and empties the phone and the optional number
    renderFields('signUp', SIGN_UP);
    type('phone', '1');
    type('phone', '');
    type('age', '1');
    type('age', '');

    assert.equal(errorOf('phone'), 'phone: Required');
    assert.equal(errorOf('age'), 'age: ok');
  });

  test('fields of two forms keep their values apart', () => {
    // Renders a field in two forms of the same tree and empties one
    render(
      <TestApp>
        <Input form="a" field={{ name: 'one', validation: z.string('Required') }} />
        <Input form="b" field={{ name: 'two', validation: z.string('Required') }} />
      </TestApp>,
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
      validation: z.number('Text'),
    };
    renderFields('pay', [oPrice]);
    type('price', '$15');

    assert.equal(screen.getByLabelText<HTMLInputElement>('price').value, '$15');
    assert.equal(errorOf('price'), 'price: ok');
  });

  test('a field without a validation breaks no rule', () => {
    // Renders a field without a validation, and types and empties it
    renderFields('stock', [{ name: 'count' }]);
    type('count', '3');
    type('count', '');

    assert.equal(errorOf('count'), 'count: ok');
  });

  test('options are the items of their path, read when the view mounts', async () => {
    // Renders a select of roles
    const oRole: FormField = { name: 'role', options: { path: '/roles' } };
    render(
      <TestApp>
        <Select form="user" field={oRole} />
      </TestApp>,
    );

    // Shows the roles of the backend
    await waitFor(() => assert.equal(screen.getByRole('status').textContent, '1:Admin,2:User'));
  });
});

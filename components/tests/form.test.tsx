// First: Testing Library needs the DOM when it loads
import './dom';
import './env/form';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, render, screen } from '@testing-library/react';
import field from '../field';
import form from '../form';
import TestApp from './provider';
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

afterEach(cleanup);

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
});

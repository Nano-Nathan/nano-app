// First: Testing Library needs the DOM when it loads
import './dom';
import './env';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { z } from 'zod';
import Form from '../src/components/form';
import TestApp from './provider';
import type { NanoObject } from '@nano-app/core/types/objects';

// Fields of the form: an email with its rule
const FIELDS = [{ name: 'email', label: 'Email', validation: z.email('Invalid email') }];

// Values each submit sent
const aSent: NanoObject[] = [];

afterEach(() => {
  cleanup();
  aSent.length = 0;
});

/** Renders the form with its button, keeping what it sends */
function renderForm(): void {
  render(
    <TestApp>
      <Form name="signUp" fields={FIELDS} onSubmit={(oValues: NanoObject) => aSent.push(oValues)}>
        <button>send</button>
      </Form>
    </TestApp>,
  );
}

test('Form shows each field with the input and its children', () => {
  renderForm();

  // The input of the email with its label, and the button
  assert.ok(screen.getByLabelText('Email'));
  assert.ok(screen.getByText('send'));
});

test('Form shows the error of a value that breaks its rule and sends nothing', () => {
  renderForm();

  // Types an invalid email and submits
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana' } });
  fireEvent.submit(screen.getByText('send'));

  // The input shows the error, and nothing is sent
  assert.ok(screen.getByText('Invalid email'));
  assert.deepEqual(aSent, []);
});

test('Form sends the values when none breaks a rule', () => {
  renderForm();

  // Types a valid email and submits
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@nano.app' } });
  fireEvent.submit(screen.getByText('send'));

  // The values are sent
  assert.deepEqual(aSent, [{ email: 'ana@nano.app' }]);
});

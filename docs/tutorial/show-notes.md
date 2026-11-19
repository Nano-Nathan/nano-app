# 3. Show and add notes

In this step you build the page: a form that adds a note and a list of the notes, with the ready controllers and views.

## Install zod

The form validates its fields with zod:

```bash
pnpm --filter frontend add zod
```

## Write the texts

Labels and messages are keys of the app's texts. Create `frontend/src/i18n/en.i18n.ts`:

```ts
export default {
  'notes.title': 'Title',
  'notes.required': 'Write a title',
  'notes.add': 'Add',
};
```

## Write the component

Create `frontend/src/components/Notes.tsx`:

```tsx
'use client';

import { Button, Card, Stack, Text } from '@mantine/core';
import { createView } from '@nano-app/frontend';
import { CollectionController } from '@nano-app/controllers';
import { Form } from '@nano-app/mantine';
import { z } from 'zod';

class NotesController extends CollectionController {
  protected root = '/collection/notes';
  protected path = '/note';

  async add(oValues: { title: string }): Promise<unknown> {
    await this.api.POST('/note', oValues);
    return this.load();
  }
}

export default createView(NotesController, notes => (
  <Stack>
    <Form
      name="note"
      fields={[
        {
          name: 'title',
          label: 'notes.title',
          validation: z.string('notes.required').min(1, 'notes.required'),
        },
      ]}
      onSubmit={notes.add}
    >
      <Button type="submit">{notes.text('notes.add')}</Button>
    </Form>
    {notes.items()?.result?.map(oNote => (
      <Card key={oNote.id}>
        <Text>{oNote.title}</Text>
      </Card>
    ))}
  </Stack>
));
```

What each piece does:

- `CollectionController` reads a page of `path` from the backend when the view mounts. `items()` gives the answer it kept.
- `add` is a method you add: it posts the values and reads the list again.
- `Form` renders a field per item of `fields`, checks each `validation`, and calls `onSubmit` with the values only when they pass.
- `notes.text('notes.add')` turns a key into the text of the current locale.

## Show it

Replace `frontend/src/app/page.tsx`:

```tsx
import { Container } from '@mantine/core';
import type { ReactNode } from 'react';
import Notes from '@/components/Notes';

export default function Home(): ReactNode {
  return (
    <Container py="xl">
      <Notes />
    </Container>
  );
}
```

Open `http://localhost:3001`. The note from the last step is there. Add one: it shows in the list. Submit the form empty: the field shows **Write a title**.

**Next:** [Sign in](./sign-in)

import { Button } from '@mantine/core';
import Form from '../../../input/Form';
import Dialog from '../../../overlay/Dialog';
import type { ReactNode } from 'react';
import type { TableController } from '@nano-app/controllers';
import type { NanoObject } from '@nano-app/core/types/objects';

/** The form of a row in a dialog, from the state its table reads: a new one without its id; an existing one can be deleted */
export default function EditModal({
  table,
  opened,
  row,
}: {
  table: TableController;
  opened: boolean;
  row: NanoObject;
}): ReactNode {
  // Its title and its submit say whether it creates a row or edits one; the submit sends the form by its name
  const oText = row.id
    ? { title: 'nano.table.edit', submit: 'nano.table.save' }
    : { title: 'nano.table.create', submit: 'nano.table.create' };
  const sForm = `table${table.props.path}`;
  return (
    <Dialog
      opened={opened}
      onClose={table.close}
      title={table.text(oText.title)}
      actions={
        <>
          {Boolean(row.id) && (
            <Button color="red" mr="auto" onClick={() => table.open('delete', row)}>
              {table.text('nano.table.delete')}
            </Button>
          )}
          <Button variant="default" onClick={table.close}>
            {table.text('nano.table.cancel')}
          </Button>
          <Button type="submit" form={sForm} loading={table.isBusy()}>
            {table.text(oText.submit)}
          </Button>
        </>
      }
    >
      <Form name={sForm} fields={table.fields()} onSubmit={table.save} />
    </Dialog>
  );
}

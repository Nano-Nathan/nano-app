import { Button, Text } from '@mantine/core';
import Dialog from '../../../overlay/Dialog';
import type { ReactNode } from 'react';
import type { TableController } from '@nano-app/controllers';

/** The confirmation of the deletion of a row in a dialog, open as its table reads it; it cannot be undone */
export default function DeleteModal({
  table,
  opened,
}: {
  table: TableController;
  opened: boolean;
}): ReactNode {
  return (
    <Dialog
      opened={opened}
      onClose={table.close}
      title={table.text('nano.table.delete')}
      actions={
        <>
          <Button variant="default" onClick={table.close}>
            {table.text('nano.table.cancel')}
          </Button>
          <Button color="red" onClick={table.remove} loading={table.isBusy()}>
            {table.text('nano.table.delete')}
          </Button>
        </>
      }
    >
      <Text>{table.text('nano.table.confirm')}</Text>
    </Dialog>
  );
}

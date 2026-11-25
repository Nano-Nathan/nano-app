'use client';

import { Button, Group, Skeleton, Stack, Table } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { TableController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { TABLE_SCROLL } from '../const';
import DeleteModal from './components/DeleteModal';
import Empty from './components/Empty';
import EditModal from './components/EditModal';
import type { CSSProperties } from 'react';
import type { NanoObject } from '@nano-app/core/types/objects';

/** A table of a backend path: a button to create, a column per field, a row per item that opens its form on a click or Enter; the grid of `NANO_CSS` needs its count of columns and the roles a table loses with it */
export default createView(TableController, table => (
  <Stack gap="md" h="100%">
    <Group justify="flex-end">
      <Button leftSection={<IconPlus />} onClick={() => table.open('edit')}>
        {table.text('nano.table.create')}
      </Button>
    </Group>
    <Skeleton visible={table.isLoading()} flex={1} mih={0}>
      <Stack h="100%" gap={0}>
        <Table.ScrollContainer {...TABLE_SCROLL}>
          <Table role="table" style={{ '--nano-columns': table.fields().length } as CSSProperties}>
            <Table.Thead role="rowgroup">
              <Table.Tr role="row">
                {table.fields().map(oField => (
                  <Table.Th key={oField.name} role="columnheader">
                    {table.text(oField.label ?? oField.name)}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody role="rowgroup">
              {table.rows().map((oRow: NanoObject) => (
                <Table.Tr
                  key={oRow.id}
                  role="row"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => table.open('edit', oRow)}
                  onKeyDown={oEvent => oEvent.key === 'Enter' && table.open('edit', oRow)}
                >
                  {table.fields().map(oField => (
                    <Table.Td key={oField.name} role="cell">
                      {table.cell(oRow, oField)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {!table.rows().length && <Empty text={table.text('nano.table.empty')} />}
      </Stack>
    </Skeleton>
    <EditModal table={table} opened={table.opened('edit')} row={table.row()} />
    <DeleteModal table={table} opened={table.opened('delete')} />
  </Stack>
));

'use client';

import { Skeleton, Table, Text } from '@mantine/core';
import { TableController } from '@nano-app/controllers';
import { createView } from '@nano-app/frontend';
import { TABLE_SCROLL } from './const';
import type { NanoObject } from '@nano-app/core/types/objects';

/** A table of a backend path: a column per field and a row per item, or a row that says it has none */
export default createView(TableController, table => (
  <Skeleton visible={table.isBusy()}>
    <Table.ScrollContainer {...TABLE_SCROLL}>
      <Table stickyHeader highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {table.fields().map(oField => (
              <Table.Th key={oField.name}>{table.text(oField.label ?? oField.name)}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {table.rows().length ? (
            table.rows().map((oRow: NanoObject) => (
              <Table.Tr key={oRow.id}>
                {table.fields().map(oField => (
                  <Table.Td key={oField.name}>{table.cell(oRow, oField)}</Table.Td>
                ))}
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={table.fields().length}>
                <Text c="dimmed" ta="center" fz="sm">
                  {table.text('nano.table.empty')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  </Skeleton>
));

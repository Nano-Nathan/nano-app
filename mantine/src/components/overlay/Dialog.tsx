import { Box, Divider, Group, Modal } from '@mantine/core';
import { token } from '../../const';
import type { ReactNode } from 'react';

/** The modal of nano-app: its title, then its content with room above and more below, where its last field has no label under it, then its actions under a line */
export default function Dialog({
  opened,
  onClose,
  title,
  actions,
  children,
}: {
  opened: boolean;
  onClose(): void;
  title: string;
  actions: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <Box pt={token('dialog-room')} pb={token('dialog-room-below')}>
        {children}
      </Box>
      <Divider mx="-md" />
      <Group justify="flex-end" pt="md">
        {actions}
      </Group>
    </Modal>
  );
}

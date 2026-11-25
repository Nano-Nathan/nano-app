import { Box, Divider, Group, Modal } from '@mantine/core';
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
      <Box pt="xl" pb="calc(var(--mantine-spacing-xl) * 1.5)">
        {children}
      </Box>
      <Divider mx="-md" />
      <Group justify="flex-end" pt="md">
        {actions}
      </Group>
    </Modal>
  );
}

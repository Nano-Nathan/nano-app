import { Box, Button, Divider, Group, Modal } from '@mantine/core';
import { token } from '../../const';
import type { ReactNode } from 'react';

/** The modal of nano-app: its title, its content with room above and below, then under a line an action apart at the start, the cancel that closes it and its submit */
export default function Dialog({
  opened,
  onClose,
  title,
  cancel,
  submit,
  start,
  children,
}: {
  opened: boolean;
  onClose(): void;
  title: string;
  cancel: string;
  submit: ReactNode;
  start?: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <Box pt={token('dialog-room')} pb={token('dialog-room-below')}>
        {children}
      </Box>
      <Divider mx="-md" />
      <Group justify="flex-end" pt="md">
        {start && <Box mr="auto">{start}</Box>}
        <Button variant="default" onClick={onClose}>
          {cancel}
        </Button>
        {submit}
      </Group>
    </Modal>
  );
}

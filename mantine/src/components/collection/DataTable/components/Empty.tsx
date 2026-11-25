import { Stack, Text, ThemeIcon } from '@mantine/core';
import { IconTableOff } from '@tabler/icons-react';
import type { ReactNode } from 'react';

/** What a table without rows shows in the space left under its header: an icon and a text that points to creating the first one */
export default function Empty({ text }: { text: string }): ReactNode {
  return (
    <Stack align="center" justify="center" gap="xs" py="xl" flex={1}>
      <ThemeIcon variant="light" size="xl" radius="xl">
        <IconTableOff />
      </ThemeIcon>
      <Text c="dimmed">{text}</Text>
    </Stack>
  );
}

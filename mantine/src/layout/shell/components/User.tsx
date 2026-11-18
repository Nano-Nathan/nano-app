import { Avatar, Group, Stack, Text, Tooltip } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';
import type { ShellUser } from '../../../types/shell';

/** The user of the session: its photo or initials, with its name and email beside it or in a tooltip */
export default function User({
  user,
  isOpen,
  text,
}: {
  user: ShellUser;
  isOpen: boolean;
  text: CSSProperties;
}): ReactNode {
  return (
    <Tooltip label={`${user.name} · ${user.email}`} position="right" disabled={isOpen}>
      <Group wrap="nowrap" gap="sm" pl="sm" mb="xs">
        <Avatar src={user.image} name={user.name} color="initials" size="sm" />
        <Stack gap={0} miw={0} style={text}>
          <Text size="sm" fw={500} truncate>
            {user.name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {user.email}
          </Text>
        </Stack>
      </Group>
    </Tooltip>
  );
}

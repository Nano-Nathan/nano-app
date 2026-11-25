'use client';

import { Box, Button, Group, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { Controller, createView } from '@nano-app/frontend';
import { PRIMARY_TINT } from '../../const';
import Illustration from './components/Illustration';

/** A faint 404 behind the title, the description and the button back to the home */
export default createView(Controller, (view, { home }) => (
  // The 404 and the texts in the same cell of a grid, one over the other
  <Box display="grid" style={{ alignItems: 'center' }}>
    <Box c={PRIMARY_TINT} style={{ gridArea: '1 / 1' }}>
      <Illustration />
    </Box>
    <Stack gap="xl" ta="center" pos="relative" style={{ gridArea: '1 / 1' }}>
      <Title order={2}>{view.text('nano.notFound.title')}</Title>
      <Text c="dimmed">{view.text('nano.notFound.description')}</Text>
      <Group justify="center">
        <Button component={Link} href={home}>
          {view.text('nano.notFound.home')}
        </Button>
      </Group>
    </Stack>
  </Box>
));

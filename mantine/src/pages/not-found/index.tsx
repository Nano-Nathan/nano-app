import { Container, Stack } from '@mantine/core';
import NotFound from './NotFound';
import type { ReactNode } from 'react';
import type { NotFoundOptions } from '../../types/notFound';

/** 404 page: a faint 404 behind a title, a description and a button to `home`; its texts are `nano.notFound` of the messages */
export default function createNotFoundPage(oOptions: NotFoundOptions): () => ReactNode {
  const { home = '/' } = oOptions;
  return () => (
    // The 404 in the middle of the screen
    <Container size="sm">
      <Stack justify="center" mih="100svh" py="xl">
        <NotFound home={home} />
      </Stack>
    </Container>
  );
}

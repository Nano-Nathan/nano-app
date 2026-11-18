import { Center, Title } from '@mantine/core';
import type { ReactNode } from 'react';

/** Home: a greeting in the middle of the screen */
export default function Home(): ReactNode {
  return (
    <Center mih="100svh">
      <Title>Hello World</Title>
    </Center>
  );
}

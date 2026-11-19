import { createLayout } from '@nano-app/mantine/server';
import type { Metadata } from 'next';

/** Title of every page */
export const metadata: Metadata = { title: 'app' };

/** Root layout: Mantine and the stores */
export default createLayout({ lang: 'en' });

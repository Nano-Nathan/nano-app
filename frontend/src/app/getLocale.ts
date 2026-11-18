import { cookies } from 'next/headers';
import { LOCALE_COOKIE } from '../const';

/** The locale the user chose, from its cookie; none before a choice */
export default async function getLocale(): Promise<string | undefined> {
  return (await cookies()).get(LOCALE_COOKIE)?.value;
}

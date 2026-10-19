import { createHash, randomBytes } from 'node:crypto';
import type { ApiKey } from '../types/auth';

/** Name of the master key */
export const MASTER = 'master';

/** A new random key: 32 bytes, URL-safe */
export function generateKey(): string {
  return randomBytes(32).toString('base64url');
}

/** SHA-256 of a key, as the table stores it */
export function hashKey(sKey: string): string {
  return createHash('sha256').update(sKey).digest('hex');
}

/** The stored key that matches the `x-api-key` header, or null */
// any: the Prisma client is generated in the consumer's project, unknown to the plugin
export async function findKey(oDb: any, sKey?: string): Promise<ApiKey | null> {
  // No header, no key
  if (!sKey) return null;

  // Looks it up by its hash
  return oDb.apiKey.findUnique({ where: { hash: hashKey(sKey) } });
}

/**
 * Creates the master key when there is none, and prints it once.
 * The unique index on isMaster lets a single instance insert it when several start together
 */
// any: the Prisma client is generated in the consumer's project, unknown to the plugin
export async function ensureMaster(oDb: any): Promise<void> {
  // Tries to insert a master; a conflict means one already exists
  const sKey = generateKey();
  const { count } = await oDb.apiKey.createMany({
    data: [{ name: MASTER, hash: hashKey(sKey), isMaster: true }],
    skipDuplicates: true,
  });
  if (!count) return;

  // Shown only now: the table keeps its hash
  console.warn(
    [
      '[nano-app] [WARNING] auth: master API key created. It is shown only once, keep it:',
      sKey,
    ].join('\n'),
  );
}

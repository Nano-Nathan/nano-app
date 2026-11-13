import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import FileLoader from '../files/FileLoader';

const STORES_DIR = fileURLToPath(new URL('./fixtures/stores', import.meta.url));

describe('FileLoader', () => {
  test('finds the files in subfolders, keyed by their subpath', async () => {
    // Finds the store files of the fixtures with a schema that takes any object
    const oFiles = await FileLoader.findMany('store', z.object({}).loose(), STORES_DIR);

    // Checks their keys and contents
    assert.deepEqual(Object.keys(oFiles).sort(), ['/admin/users', '/app']);
    assert.deepEqual(oFiles['/admin/users'], { type: 'app', data: { aUsers: [] } });
  });

  test('a file that breaks the schema fails, naming its subpath', async () => {
    // Checks with a schema the fixtures do not follow
    const oSchema = z.object({ type: z.literal('api') });
    await assert.rejects(
      FileLoader.findMany('store', oSchema, STORES_DIR),
      /\/(app|admin\/users):\n/,
    );
  });
});

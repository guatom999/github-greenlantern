import { copyFile } from 'node:fs/promises';

// Resolve from the compiled script, independently of the caller's directory.
await copyFile(
  new URL('../../src/preview/styles.css', import.meta.url),
  new URL('../src/preview/styles.css', import.meta.url),
);

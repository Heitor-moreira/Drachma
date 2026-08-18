import { mkdir, writeFile } from 'node:fs/promises';

const version = {
  commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || '',
  builtAt: new Date().toISOString(),
  appVersion: process.env.npm_package_version || '1.0.0'
};

await mkdir('dist', { recursive: true });
await writeFile('dist/version.json', `${JSON.stringify(version, null, 2)}\n`);

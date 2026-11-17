/**
 * Zero-dependency build: copies the files the browser needs into ./dist.
 * The app is plain HTML + CSS + native ES modules, so no bundling is required;
 * dist/ is simply the deployable subset of the repository (no tests, scripts or tooling).
 */
import { cp, rm, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const entry of ['index.html', 'src', 'assets']) {
  await cp(resolve(root, entry), resolve(dist, entry), { recursive: true });
}
console.log('Build complete → dist/');

/**
 * Zero-dependency static file server for local development.
 * ES modules need to be served over HTTP (they do not load from file://).
 *
 * Usage: node scripts/dev-server.mjs [directory] [--port=5173]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const root = resolve(args.find(a => !a.startsWith('--')) ?? '.');
const port = Number((args.find(a => a.startsWith('--port=')) ?? '--port=5173').split('=')[1]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    let file = normalize(join(root, decodeURIComponent(pathname)));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}).listen(port, () => console.log(`Serving ${root}\n  → http://localhost:${port}`));

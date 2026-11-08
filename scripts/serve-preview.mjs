import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../apps/mobile/dist/', import.meta.url)));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
};
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.startsWith('/v1/') || path === '/health') {
      res.writeHead(404);
      res.end('This is an offline app. No API server is connected.');
      return;
    }
    let target = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!target.startsWith(root + sep) && target !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const info = await stat(target);
      if (!info.isFile()) throw new Error('Not a file');
    } catch {
      if (extname(path)) {
        res.writeHead(404);
        res.end();
        return;
      }
      target = resolve(root, 'index.html');
    }
    const bytes = await readFile(target);
    res.writeHead(200, {
      'Content-Type': types[extname(target)] ?? 'application/octet-stream',
      'Cache-Control':
        extname(target) === '.html' || path === '/sw.js'
          ? 'no-cache'
          : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch {
    res.writeHead(500);
    res.end('Unable to serve preview.');
  }
}).listen(Number(process.env.PORT ?? 3000), '0.0.0.0', () =>
  console.log('LingoQuest offline preview: http://127.0.0.1:' + (process.env.PORT ?? 3000)),
);

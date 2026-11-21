import { readdir, writeFile, readFile } from 'node:fs/promises';

const root = new URL('../apps/mobile/dist/', import.meta.url);
async function files(path) {
  const result = [];
  for (const item of await readdir(new URL(path, root), { withFileTypes: true })) {
    const name = path + item.name;
    if (name === 'chapter-packs') continue;
    if (item.isDirectory()) result.push(...(await files(name + '/')));
    else if (!name.endsWith('.map') && name !== 'sw.js' && name !== 'metadata.json')
      result.push('/' + name);
  }
  return result;
}

const assets = await files('');
const html = await readFile(new URL('index.html', root), 'utf8');
await writeFile(new URL('index.html', root), html.replace('lang="en"', 'lang="es-419"'));
const version = 'lq-' + (html.match(/index-([^".]+)/)?.[1] ?? Date.now());
await writeFile(
  new URL('sw.js', root),
  `const CACHE = ${JSON.stringify(version)};
const ASSETS = ${JSON.stringify([...assets, '/'])};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('lq-') && key !== CACHE)
      .map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

async function assetResponse(request) {
  const cached = await caches.match(request);
  if (!cached) return fetch(request);
  const range = request.headers.get('Range');
  if (!range || !new URL(request.url).pathname.endsWith('.mp3')) return cached;
  const bytes = await cached.arrayBuffer();
  const match = /^bytes=(\\d*)-(\\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2]))
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + bytes.byteLength } });
  const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
  if (start > end)
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + bytes.byteLength } });
  return new Response(bytes.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + bytes.byteLength,
      'Content-Length': String(end - start + 1),
    },
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname.startsWith('/v1/') || url.pathname.startsWith('/chapter-packs/') ||
      url.pathname === '/health') return;
  event.respondWith(event.request.mode === 'navigate'
    ? fetch(event.request).catch(() => caches.match('/index.html'))
    : assetResponse(event.request));
});
`,
);
console.log('Prepared offline web shell (' + assets.length + ' assets).');

import { readdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root = new URL('../apps/mobile/dist/', import.meta.url);
async function files(path) {
  const result = [];
  for (const item of await readdir(new URL(path, root), { withFileTypes: true })) {
    const name = path + item.name;
    if (item.isDirectory()) result.push(...(await files(name + '/')));
    else if (!name.endsWith('.map') && name !== 'sw.js' && name !== 'metadata.json')
      result.push('/' + name);
  }
  return result;
}
const assets = await files('');
const html = await readFile(new URL('index.html', root), 'utf8');
await writeFile(new URL('index.html', root), html.replace('lang="en"', 'lang="es-419"'));
const version = 'lq-' + (html.match(/index-([^\".]+)/)?.[1] ?? Date.now());
await writeFile(
  new URL('sw.js', root),
  `const CACHE=${JSON.stringify(version)};const ASSETS=${JSON.stringify([...assets, '/'])};self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lq-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/v1/')||url.pathname==='/health')return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return;}event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));});`,
);
console.log('Prepared offline web shell (' + assets.length + ' assets).');

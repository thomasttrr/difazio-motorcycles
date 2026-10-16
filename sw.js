const V='difazio-v17-curate',CORE=['./','manifest.webmanifest','favicon.png','fonts/fraunces-600.woff2','fonts/inter-var.woff2','img/ducati-750-2-w960.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// Vendored three.js (/vendor/) and 3D models (/models/) is cache-first and refreshed when this cache version changes. HTML, JS, CSS and the manifest: network first, cache only as offline fallback. Images and fonts: cache first.
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin)return;
 const fresh=!/^\/(vendor|models)\//.test(u.pathname)&&(r.mode==='navigate'||/\.(js|css|html|webmanifest)$/.test(u.pathname)||u.pathname.endsWith('/'));
 if(fresh){e.respondWith(fetch(r.mode==='navigate'?r:new Request(r,{cache:'no-cache'})).then(res=>{if(res.ok){const cl=res.clone();caches.open(V).then(c=>c.put(r.mode==='navigate'?'./':r,cl))}return res}).catch(()=>caches.match(r.mode==='navigate'?'./':r)));return}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(V).then(c=>c.put(r,cl))}return res})))});

const V='difazio-v6',CORE=['./','index.html','app.js','manifest.webmanifest','favicon.png','fonts/fraunces-600.woff2','fonts/inter-var.woff2','img/ducati-750-2-w960.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{caches.open(V).then(c=>c.put('index.html',res.clone()));return res}).catch(()=>caches.match('index.html')));return}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(V).then(c=>c.put(r,cl))}return res})))});

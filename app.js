const T=[["1914","Pascal Difazio opens a bicycle shop at 25 Catherine Street, Frome. His son John (Jack) is born the same year."],
["1920s","The shop sells BSA, Triumph and Brough motorcycles, delivered by train. Jack recalled visits from George Brough and T. E. Lawrence."],
["c.1930","Jack starts grass-track racing at 16 on a BSA Blue Star, later moving to a Rudge Ulster."],
["1947","Jack leaves Pinks in London to take over the business as Pascal retires."],
["1956","First hub-centre machine: a BSA Gold Flash sidecar outfit with a Reliant-type swinging arm and a Ford Prefect brake drum."],
["1957–59","Richard joins the shop, passengers for Jack on the grass, then starts road racing in 1959."],
["1962–65","The shop becomes agents for Honda (1962), Suzuki (1963) and Yamaha (1965)."],
["1968","Patent GB1274441 is filed. Richard races the first solo hub-steerer, an AJS 7R special, at Thruxton."],
["1969","A hub-steered Triumph Trident road bike appears on Frome’s streets."],
["1973–76","Highlights: a Suzuki GT550 for Bike, a Norton Commando, Mead & Tomkinson’s Laverda racer, the Ducati 750 and three Hurricanes."],
["1980s","Production winds down by 1983 and the shop turns to BMW twins."],
["Early 1990s","The workshops face redevelopment, and John Ransome saves the moulds and spares."],
["2007/8","Richard builds the last of his five BMW R65 Difazio Specials."],
["2012","A Hurricane-engined Difazio wins the Kay Engineering Trophy at Stafford. Jack Difazio dies the same year."]];
const nav=document.querySelector('.tl-nav'),card=document.querySelector('.tl-card');
T.forEach(([y],i)=>{const b=document.createElement('button');b.type='button';b.textContent=y;b.setAttribute('role','tab');b.onclick=()=>show(i,true);nav.append(b)});
function show(i,focus){[...nav.children].forEach((b,j)=>{const on=i==j;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;if(on){if(focus)b.focus({preventScroll:true});nav.scrollTo({left:b.offsetLeft-nav.clientWidth/2+b.clientWidth/2,behavior:'smooth'})}});card.innerHTML=`<b>${T[i][0]}</b><p>${T[i][1]}</p>`;cur=i}
let cur=0;show(0);
nav.addEventListener('keydown',e=>{const k={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(k){e.preventDefault();show((cur+k+T.length)%T.length,true)}else if(e.key=='Home'){show(0,true)}else if(e.key=='End'){show(T.length-1,true)}});
// menu
const burger=document.querySelector('.burger'),menu=document.getElementById('menu');
burger.onclick=()=>{const o=burger.getAttribute('aria-expanded')!='true';burger.setAttribute('aria-expanded',o);menu.classList.toggle('open',o)};
menu.addEventListener('click',e=>{if(e.target.tagName=='A'){burger.setAttribute('aria-expanded','false');menu.classList.remove('open')}});
// active section
const links=[...document.querySelectorAll('.menu a,.bnav a')];
const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)links.forEach(a=>a.classList.toggle('active',a.hash=='#'+en.target.id))}),{rootMargin:'-45% 0px -50% 0px'});
links.forEach(a=>{const s=document.querySelector(a.hash);s&&io.observe(s)});
// back to top
const tt=document.querySelector('.totop');addEventListener('scroll',()=>tt.classList.toggle('show',scrollY>900),{passive:true});
// lightbox with prev/next, keys, swipe
const lb=document.querySelector('.lightbox'),lbImg=lb.querySelector('img'),lbCap=lb.querySelector('p'),items=[...document.querySelectorAll('.lb')];let idx=0,opener;
function lbShow(i){idx=(i+items.length)%items.length;const b=items[idx];lbImg.src=b.dataset.src;lbImg.alt=b.querySelector('img').alt;lbCap.innerHTML=b.dataset.cap}
items.forEach((b,i)=>b.onclick=()=>{opener=b;lbShow(i);lb.showModal()});
lb.querySelector('.close').onclick=()=>lb.close();lb.querySelector('.prev').onclick=()=>lbShow(idx-1);lb.querySelector('.next').onclick=()=>lbShow(idx+1);
lb.onclick=e=>{if(e.target==lb)lb.close()};lb.addEventListener('close',()=>opener&&opener.focus());
lb.addEventListener('keydown',e=>{if(e.key=='ArrowRight')lbShow(idx+1);if(e.key=='ArrowLeft')lbShow(idx-1)});
function swipe(el,onL,onR){let x0=null,y0;el.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});el.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)(dx<0?onL:onR)();x0=null},{passive:true})}
swipe(lb,()=>lbShow(idx+1),()=>lbShow(idx-1));
swipe(card,()=>show((cur+1)%T.length,false),()=>show((cur-1+T.length)%T.length,false));
// scroll reveal
if(matchMedia('(prefers-reduced-motion: no-preference)').matches&&'IntersectionObserver'in window){const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});document.querySelectorAll('[data-r]').forEach(el=>ro.observe(el))}else document.querySelectorAll('[data-r]').forEach(el=>el.classList.add('in'));
// offline
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
// hub explainer
(()=>{const x=document.querySelector('.hx');if(!x)return;const cap=x.querySelector('.hx-cap'),br=x.querySelector('.brake');
const C={fork:['Telescopic forks: the wheel steers from the headstock, high above it. Braking force runs up the sliding tubes.','Braking: the forks compress and the front end dives, which changes the steering geometry mid-corner.'],
hub:['Hub-centre: the wheel pivots on a king-pin inside its own hub. A swinging arm handles suspension and braking.','Braking: the force goes back along the swinging arm into the frame, so the bike stays nearly level. Manchester’s testers found “up to 80mph the handlebars were almost superfluous”.']};
function upd(){cap.textContent=C[x.dataset.mode][+x.dataset.brake]}
x.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{x.dataset.mode=b.dataset.set;x.querySelectorAll('[data-set]').forEach(o=>o.setAttribute('aria-pressed',o===b));upd()});
br.onclick=()=>{const on=x.dataset.brake!='1';x.dataset.brake=on?'1':'0';br.setAttribute('aria-pressed',on);br.textContent=on?'Release brake':'Brake hard';upd()};upd()})();

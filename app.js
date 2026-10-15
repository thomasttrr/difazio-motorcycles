const T=[["1914","Pascal Difazio is selling bicycles from a cottage on Catherine Street, Frome. Jack is born on 25 August."],
["1919","On 18 October Pascal buys No. 25 Catherine Street, with no record of a mortgage."],
["1920s","Brough Superior agent by 1923, and the first BSA dealer in Somerset. Jack recalled meeting T. E. Lawrence."],
["c.1930","Jack starts grass-track racing at 16 on a BSA Blue Star, later moving to a Rudge Ulster."],
["1947","Jack leaves Pinks in London to take over the business as Pascal retires."],
["1956","First hub-centre machine: a BSA Gold Flash sidecar outfit with a Reliant-type swinging arm and a Ford Prefect brake drum."],
["1957–59","Richard joins the shop and passengers for Jack on the grass. His first road race is at Silverstone in April 1959."],
["1962–65","The shop becomes agents for Honda (1962), Suzuki (1963) and Yamaha (1965)."],
["1968","Patent GB1274441 is filed. Richard races the first solo hub-steerer, an AJS 7R special, at Thruxton."],
["1969","A hub-steered Triumph Trident road bike appears on Frome’s streets."],
["1973–76","Highlights: a Suzuki GT550 for Bike, a Norton Commando, Mead & Tomkinson’s Laverda racer, the Ducati 750 and three Hurricanes."],
["1980s","Production winds down by 1983 and the shop turns to BMW twins."],
["Early 1990s","The workshops face redevelopment, and John Ransome saves the moulds and spares."],
["c.2007","Aged 93, Jack helps make a new batch of hubs. Richard builds the last of his five R65 Difazio Specials."],
["2008","Richard closes the shop at No. 25 after nearly 90 years there."],
["2012","A Hurricane-engined Difazio wins the Kay Engineering Trophy at Stafford. Jack Difazio dies the same year."]];
const nav=document.querySelector('.tl-nav'),card=document.querySelector('.tl-card');
T.forEach(([y],i)=>{const b=document.createElement('button');b.type='button';b.textContent=y;b.setAttribute('role','tab');b.onclick=()=>show(i,true);nav.append(b)});
function show(i,focus){[...nav.children].forEach((b,j)=>{const on=i==j;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;if(on){if(focus)b.focus({preventScroll:true});nav.scrollTo({left:b.offsetLeft-nav.clientWidth/2+b.clientWidth/2,behavior:'smooth'})}});card.innerHTML=`<b>${T[i][0]}</b><p>${T[i][1]}</p>`;cur=i}
let cur=0;show(0);
nav.addEventListener('keydown',e=>{const k={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(k){e.preventDefault();show((cur+k+T.length)%T.length,true)}else if(e.key=='Home'){show(0,true)}else if(e.key=='End'){show(T.length-1,true)}});
// menu
const burger=document.querySelector('.burger'),menu=document.getElementById('menu');
function setMenu(o){burger.setAttribute('aria-expanded',o);menu.classList.toggle('open',o);document.body.classList.toggle('menu-open',o);burger.setAttribute('aria-label',o?'Close menu':'Open menu')}
burger.onclick=()=>setMenu(burger.getAttribute('aria-expanded')!='true');
menu.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false)});
// priority+ nav: one row; overflow → More; too few fit → burger
const topnav=document.querySelector('.nav'),brand=topnav.querySelector('.brand'),more=topnav.querySelector('.more'),moreBtn=more.querySelector('.more-btn'),moreList=more.querySelector('.more-list');
const navLinks=[...menu.querySelectorAll('a')].sort((x,y)=>+(x.dataset.p)-+(y.dataset.p));
const links=[];
const refreshLinks=()=>{links.length=0;links.push(...document.querySelectorAll('.menu a,.more-list a,.bnav a'))};
const MIN_VISIBLE=4,BURGER_BELOW=1000;
function setMore(o,focusFirst){moreBtn.setAttribute('aria-expanded',!!o);moreList.hidden=!o;if(o&&focusFirst){const f=moreList.querySelector('a');f&&f.focus()}}
function restore(){navLinks.forEach(l=>menu.append(l))}
function gapOf(el){const cs=getComputedStyle(el);return parseFloat(cs.columnGap)||parseFloat(cs.gap)||0}
function avail(){const cs=getComputedStyle(topnav);const gap=gapOf(topnav)||16;return topnav.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-brand.offsetWidth-gap*2}
function contentW(el){const kids=[...el.children].filter(c=>c.offsetParent!==null||c.getClientRects().length);if(!kids.length)return 0;const g=gapOf(el);return kids.reduce((w,c)=>w+c.offsetWidth,0)+g*Math.max(0,kids.length-1)}
let layingOut=false,needsRelayout=false;
function layout(){
  if(layingOut){needsRelayout=true;return}
  layingOut=true;needsRelayout=false;
  setMore(false);restore();moreList.replaceChildren();more.hidden=true;topnav.classList.remove('burger-mode');
  void topnav.offsetWidth;
  if(innerWidth<BURGER_BELOW){
    topnav.classList.add('burger-mode');document.documentElement.classList.add('nav-ready');refreshLinks();layingOut=false;if(needsRelayout)layout();return
  }
  setMenu(false);
  let room=avail();
  if(contentW(menu)>room+1){
    more.hidden=false;void more.offsetWidth;
    room=avail()-more.offsetWidth-(gapOf(topnav)||16);
    const vis=[...navLinks];
    while(vis.length&&contentW(menu)>room+1){moreList.prepend(vis.pop())}
    if(vis.length<MIN_VISIBLE){restore();moreList.replaceChildren();more.hidden=true;topnav.classList.add('burger-mode')}
  }
  moreBtn.classList.toggle('has-active',!!moreList.querySelector('a.active'));
  document.documentElement.classList.add('nav-ready');refreshLinks();
  layingOut=false;if(needsRelayout)layout();
}
moreBtn.addEventListener('click',()=>setMore(moreBtn.getAttribute('aria-expanded')!='true'));
moreBtn.addEventListener('keydown',e=>{if(e.key=='ArrowDown'){e.preventDefault();setMore(true,true)}});
moreList.addEventListener('keydown',e=>{const it=[...moreList.querySelectorAll('a')],i=it.indexOf(document.activeElement);
  if(e.key=='ArrowDown'){e.preventDefault();it[(i+1)%it.length].focus()}else if(e.key=='ArrowUp'){e.preventDefault();it[(i-1+it.length)%it.length].focus()}
  else if(e.key=='Home'){e.preventDefault();it[0].focus()}else if(e.key=='End'){e.preventDefault();it[it.length-1].focus()}});
moreList.addEventListener('click',e=>{if(e.target.closest('a'))setMore(false)});
moreList.addEventListener('focusout',e=>{if(!more.contains(e.relatedTarget))setMore(false)});
document.addEventListener('keydown',e=>{if(e.key=='Escape'){if(moreBtn.getAttribute('aria-expanded')=='true'){setMore(false);moreBtn.focus()}else if(burger.getAttribute('aria-expanded')=='true'){setMenu(false);burger.focus()}}});
document.addEventListener('pointerdown',e=>{if(!more.contains(e.target))setMore(false)});
let raf;const relayout=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(layout)};
new ResizeObserver(relayout).observe(topnav);
new ResizeObserver(relayout).observe(brand);
// logo: typewriter retire from the end (o,i,z,a,f,i) over ~600px of scroll; one rAF driver for every browser.
// Display progress is lerped toward scroll progress.
// Reduced motion: opacity fade + collapse only (no blur/drift via CSS), no lerp.
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const letters=[...brand.querySelectorAll('.brand-l')].reverse();
// each letter owns a slice; slices overlap 30% so the next fade starts while the previous collapses.
// within a slice: opacity fades over 0-75%, width collapses over 65-100% (once mostly transparent). Reverse mirrors it.
const N=letters.length,OVL=.3,SL=1/(N-(N-1)*OVL),STEP=SL*(1-OVL);
const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t),seg=(t,a,b)=>ease((t-a)/(b-a));
let lCur=-1,lRaf=0,lUntil=0,lRange=600;
const sizeRange=()=>{lRange=Math.max(480,Math.min(700,(window.visualViewport?visualViewport.height:innerHeight)*.75))};
// clamp: iOS rubber-band gives negative / overshoot scrollY
const target=()=>scrollY<=2?0:Math.min(1,scrollY/lRange);
function paint(p){if(p<=0){letters.forEach(el=>{el.style.removeProperty('--f');el.style.removeProperty('--w')});return}letters.forEach((el,i)=>{const t=(p-i*STEP)/SL;el.style.setProperty('--f',seg(t,0,.75).toFixed(4));el.style.setProperty('--w',seg(t,.65,1).toFixed(4))})}
// reads scrollY every frame while scrolling and ~300ms after (covers momentum frames with no scroll event), snaps within epsilon
function tick(now){const tg=target();if(lCur<0||reduceMotion.matches)lCur=tg;else{lCur+=(tg-lCur)*.22;if(Math.abs(tg-lCur)<.002)lCur=tg}paint(lCur);
  if(lCur!==tg||now<lUntil)lRaf=requestAnimationFrame(tick);else lRaf=0}
// safety net: if rAF is starved (iOS low-power, momentum), snap to the true position shortly after scrolling stops
let lSnap=0;const snap=()=>{lCur=target();paint(lCur)};
let lSettle=0;
const kick=()=>{lUntil=performance.now()+300;clearTimeout(lSnap);clearTimeout(lSettle);lSnap=setTimeout(snap,400);lSettle=setTimeout(snap,1200);if(!lRaf)lRaf=requestAnimationFrame(tick)};
const resync=()=>{sizeRange();lCur=-1;kick()};
addEventListener('scroll',kick,{passive:true});
addEventListener('scrollend',()=>{kick();snap()});
addEventListener('touchend',kick,{passive:true});
addEventListener('resize',resync);
addEventListener('orientationchange',resync);
window.visualViewport&&visualViewport.addEventListener('resize',resync);
reduceMotion.addEventListener&&reduceMotion.addEventListener('change',resync);
addEventListener('pageshow',e=>{resync();if(e.persisted)relayout()});
sizeRange();lCur=-1;tick(performance.now());
addEventListener('resize',relayout);
document.fonts&&document.fonts.ready.then(relayout);
layout();
// active section
refreshLinks();
const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){refreshLinks();links.forEach(a=>a.classList.toggle('active',a.hash=='#'+en.target.id));moreBtn.classList.toggle('has-active',!!moreList.querySelector('a.active'))}}),{rootMargin:'-45% 0px -50% 0px'});
links.forEach(a=>{const s=document.querySelector(a.hash);s&&io.observe(s)});
new MutationObserver(()=>moreBtn.classList.toggle('has-active',!!moreList.querySelector('a.active'))).observe(moreList,{subtree:true,attributes:true,attributeFilter:['class']});
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

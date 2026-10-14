const T=[["1914","Pascal Difazio opens a bicycle shop at 25 Catherine Street, Frome. His son John (Jack) is born the same year."],
["1920s","The shop sells BSA, Triumph and Brough motorcycles, delivered by train. Jack recalled visits from George Brough and T. E. Lawrence."],
["c.1930","Jack starts grass-track racing at 16 on a BSA Blue Star, later moving to a Rudge Ulster."],
["1947","Jack leaves Pinks in London to take over the business as Pascal retires."],
["1956","First hub-centre machine: a BSA Gold Flash sidecar outfit with a Reliant-type swinging arm and a Ford Prefect brake drum."],
["1957–59","Richard joins the shop, passengers for Jack on the grass, then starts road racing in 1959."],
["1962–65","The shop becomes agents for Honda (1962), Suzuki (1963) and Yamaha (1965)."],
["1968","Patent GB1274441 is filed. Richard races the first solo hub-steerer, an AJS 7R special, at Thruxton."],
["1969","A hub-steered Triumph Trident road bike appears on Frome’s streets."],
["1973–76","Busiest years: a Suzuki GT550 for Bike, a Norton Commando, Mead & Tomkinson’s Laverda racer, the Ducati 750 and three Hurricanes."],
["1980s","Production winds down by 1983 and the shop turns to BMW twins."],
["Early 1990s","The workshops face redevelopment, and John Ransome saves the moulds and spares."],
["2007/8","Richard builds the last of his five BMW R65 Difazio Specials."],
["2012","A Hurricane-engined Difazio wins the Kay Engineering Trophy at Stafford. Jack Difazio dies the same year."]];
const nav=document.querySelector('.tl-nav'),card=document.querySelector('.tl-card');
T.forEach(([y],i)=>{const b=document.createElement('button');b.textContent=y;b.setAttribute('role','tab');b.onclick=()=>show(i,true);nav.append(b)});
function show(i,focus){[...nav.children].forEach((b,j)=>{const on=i==j;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;if(on&&focus){b.focus();b.scrollIntoView({block:'nearest',inline:'center'})}});card.innerHTML=`<b>${T[i][0]}</b><p>${T[i][1]}</p>`;cur=i}
let cur=0;show(0);
nav.addEventListener('keydown',e=>{const k={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(k){e.preventDefault();show((cur+k+T.length)%T.length,true)}else if(e.key=='Home'){show(0,true)}else if(e.key=='End'){show(T.length-1,true)}});
// menu
const burger=document.querySelector('.burger'),menu=document.getElementById('menu');
burger.onclick=()=>{const o=burger.getAttribute('aria-expanded')!='true';burger.setAttribute('aria-expanded',o);menu.classList.toggle('open',o)};
menu.addEventListener('click',e=>{if(e.target.tagName=='A'){burger.setAttribute('aria-expanded','false');menu.classList.remove('open')}});
// active section
const links=[...menu.querySelectorAll('a')];
const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)links.forEach(a=>a.classList.toggle('active',a.hash=='#'+en.target.id))}),{rootMargin:'-45% 0px -50% 0px'});
links.forEach(a=>{const s=document.querySelector(a.hash);s&&io.observe(s)});
// back to top
const tt=document.querySelector('.totop');addEventListener('scroll',()=>tt.classList.toggle('show',scrollY>900),{passive:true});
// lightbox
const lb=document.querySelector('.lightbox');let opener;
document.querySelectorAll('.lb').forEach(b=>b.onclick=()=>{opener=b;lb.querySelector('img').src=b.dataset.src;lb.querySelector('img').alt=b.querySelector('img').alt;lb.querySelector('p').innerHTML=b.dataset.cap;lb.showModal()});
lb.querySelector('.close').onclick=()=>lb.close();lb.onclick=e=>{if(e.target==lb)lb.close()};lb.addEventListener('close',()=>opener&&opener.focus());

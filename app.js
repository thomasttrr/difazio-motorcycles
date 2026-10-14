const T=[["1914","Pascal Difazio opens a bicycle shop at 25 Catherine Street, Frome. His son John (Jack) is born the same year."],
["1947","Jack returns from London to take over the family business as Pascal retires."],
["1956","First hub-centre steered machine: a BSA sidecar outfit with a Reliant-type swinging arm and a Ford Prefect brake drum."],
["1957–59","Son Richard joins the shop, passengers for Jack on the grass, then starts road racing in 1959."],
["1962–65","Difazio’s becomes agents for Honda (1962), Suzuki (1963) and Yamaha (1965)."],
["1968","Disc brakes make a solo hub-steerer possible. Jack files his patent; the hub-steer era begins."],
["1969","The Triumph Trident-powered hub-steered road bike appears on Frome’s streets."],
["1968–83","Roughly 50 machines built or converted by Jack and a team of three, praised by the motorcycle press."],
["1980s","With no manufacturer adopting the idea, the shop turns to BMW twins and becomes a leading independent BMW specialist."],
["2012","A 1976 Triumph Hurricane-engined Difazio wins the Kay Engineering Trophy at Stafford. Jack Difazio dies later that year."]];
const nav=document.querySelector('.tl-nav'),card=document.querySelector('.tl-card');
T.forEach(([y,t],i)=>{const b=document.createElement('button');b.textContent=y;b.onclick=()=>show(i);nav.append(b)});
function show(i){[...nav.children].forEach((b,j)=>b.classList.toggle('on',i==j));card.innerHTML=`<b>${T[i][0]}</b><p class="lead" style="margin:10px 0 0">${T[i][1]}</p>`}
show(0);

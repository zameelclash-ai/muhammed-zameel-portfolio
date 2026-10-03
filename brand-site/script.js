const btn=document.querySelector('.menu-btn'),menu=document.getElementById('menu');
btn.addEventListener('click',()=>{const o=menu.classList.toggle('open');btn.setAttribute('aria-expanded',o)});
menu.addEventListener('click',e=>{if(e.target.tagName==='A'){menu.classList.remove('open');btn.setAttribute('aria-expanded',false)}});
document.getElementById('year').textContent=new Date().getFullYear();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

const WA='919656424089';
const wa=t=>window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(t),'_blank','noopener');
document.getElementById('form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);
 wa(`Hello Fly Guide, I'm ${f.get('name')} (${f.get('phone')}).\nService: ${f.get('service')}\n${f.get('message')}`)});
document.querySelectorAll('[data-wa]').forEach(a=>{a.href='#contact';a.addEventListener('click',e=>{e.preventDefault();wa(`Hello Fly Guide, I'd like a quote for a ${a.dataset.wa} trip.`)})});
// Add real content here; a section stays hidden while its list is empty.
const PHOTOS=[/* {src:'photos/customer1.jpg',alt:'Happy customers'} */];
const REVIEWS=[/* {text:'Great service!',name:'Customer name'} */];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
if(PHOTOS.length){const s=document.getElementById('gallery');s.hidden=false;document.getElementById('gallery-grid').innerHTML=PHOTOS.map(p=>`<img src="${esc(p.src)}" alt="${esc(p.alt||'')}" loading="lazy">`).join('')}
if(REVIEWS.length){const s=document.getElementById('reviews');s.hidden=false;document.getElementById('reviews-grid').innerHTML=REVIEWS.map(r=>`<article class="card"><p>“${esc(r.text)}”</p><span class="who">${esc(r.name)}</span></article>`).join('')}

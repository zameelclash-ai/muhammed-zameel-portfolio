var WA='919656424089';
var $=function(id){return document.getElementById(id)};
var wa=function(t){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(t)};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};

// Menu
var btn=$('menu-btn'),menu=$('menu');
function closeMenu(){menu.classList.remove('open');btn.setAttribute('aria-expanded','false')}
btn.addEventListener('click',function(){var o=menu.classList.toggle('open');btn.setAttribute('aria-expanded',o)});
menu.addEventListener('click',function(e){if(e.target.tagName==='A')closeMenu()});
$('year').textContent=new Date().getFullYear();

// WhatsApp links
$('hero-wa').href=wa('Hello Fly Guide, I would like to plan a trip.');
document.querySelectorAll('[data-wa]').forEach(function(a){a.href=wa("Hello Fly Guide, I'd like details and a quote for: "+a.dataset.wa)});
var send=$('send');
function upd(){send.href=wa("Hello Fly Guide, I'm "+($('f-name').value||'(name)')+' ('+($('f-phone').value||'phone')+').\nService: '+$('f-service').value+'\n'+$('f-msg').value)}
$('form').addEventListener('input',upd);upd();

// Photos. Add more by dropping files in photos/ and listing them here.
var CUSTOMERS=[
 {src:'photos/customer-thailand.jpg',alt:'Happy customers returning from Thailand',cap:'Thailand'},
 {src:'photos/customer-varanasi.jpg',alt:'Happy customers on the Kerala to Delhi to Varanasi tour',cap:'Kerala to Delhi to Varanasi'}
];
var STORE=[
 {src:'photos/office-1.jpg',alt:'Fly Guide store with blue ceiling lights and world map',cap:'Reception and waiting area'},
 {src:'photos/office-5.jpg',alt:'A team member working at the Fly Guide booking desk',cap:'Our team at work',tall:true},
 {src:'photos/office-2.jpg',alt:'Fly Guide booking desks',cap:'Booking desks'},
 {src:'photos/office-3.jpg',alt:'Booking desk with aeroplane models overhead',cap:'Ticketing desk'},
 {src:'photos/office-4.jpg',alt:'Fly Guide logo wall',cap:'Fly Guide logo wall'}
];
function shots(list){return list.map(function(p,i){return '<button class="shot'+(p.tall?' tall':'')+'" data-src="'+esc(p.src)+'" data-alt="'+esc(p.alt)+'"><img src="'+esc(p.src)+'" alt="'+esc(p.alt)+'" loading="lazy"><figcaption>'+esc(p.cap)+'</figcaption></button>'}).join('')}
$('customer-grid').innerHTML=shots(CUSTOMERS);
$('store-grid').innerHTML=shots(STORE);
var lb=$('lightbox'),lbi=$('lb-img');
document.addEventListener('click',function(e){var s=e.target.closest('.shot');if(s){lbi.src=s.dataset.src;lbi.alt=s.dataset.alt;lb.hidden=false}else if(e.target===lb||e.target.id==='lb-close'){lb.hidden=true}});
document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.hidden=true});

// Reviews. SAMPLE=true shows a notice on the page; set it to false once these are real customer words.
var SAMPLE=true;
var REVIEWS=[
 {text:'They handled my visa and tickets in one visit. No running around, and every document was checked twice.',name:'Sample review',trip:'Visa & flights'},
 {text:'Our family trip was planned to the last detail. Hotel, transfers and sightseeing were all smooth.',name:'Sample review',trip:'Holiday package'},
 {text:'Clear guidance for our Umrah group, from the visa to the hotel near the Haram. Very patient with our questions.',name:'Sample review',trip:'Umrah'}
];
$('sample-note').hidden=!SAMPLE;
$('reviews-grid').innerHTML=REVIEWS.map(function(r){return '<figure class="rev" style="margin:0"><div class="stars" aria-label="5 out of 5 stars">★★★★★</div><p>“'+esc(r.text)+'”</p><cite>'+esc(r.name)+'<small>'+esc(r.trip)+'</small></cite></figure>'}).join('');

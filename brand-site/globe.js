// Interactive 3D globe with every country. Tap a country to turn to it and send a package enquiry.
(function(){
  var box=document.getElementById('globe');
  if(!box||typeof THREE==='undefined'||!window.COUNTRIES){if(box)box.classList.add('no-webgl');return}
  var renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){box.classList.add('no-webgl');return}
  var NAVY=0x1a2b6d,ORANGE=0xe8531f,WA='919656424089';
  var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,0.1,50);
  camera.position.z=3.55;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  box.appendChild(renderer.domElement);
  var globe=new THREE.Group();scene.add(globe);
  function ll(lat,lon,r){lat*=Math.PI/180;lon*=Math.PI/180;return new THREE.Vector3(r*Math.cos(lat)*Math.sin(lon),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(lon))}

  // ---- countries ----
  var C=window.COUNTRIES.slice();
  C.push({n:'Maldives',p:[[72.6,7.1,73.9,7.1,73.9,-0.7,72.6,-0.7,72.6,7.1]]}); // too small for the 1:50m data set
  C.sort(function(a,b){return a.n<b.n?-1:1});
  C.forEach(function(c){var b=[181,91,-181,-91];c.p.forEach(function(r){for(var i=0;i<r.length;i+=2){if(r[i]<b[0])b[0]=r[i];if(r[i]>b[2])b[2]=r[i];if(r[i+1]<b[1])b[1]=r[i+1];if(r[i+1]>b[3])b[3]=r[i+1]}});c.b=b});
  // packages we run, by country name in the data set
  var PK={
   'United Arab Emirates':[{id:2,t:'Dubai Highlights'}],
   'Maldives':[{id:1,t:'Maldives Escape'}],
   'Thailand':[{id:3,t:'Pattaya Paradise'}],
   'India':[{id:5,t:'Delhi · Agra · Varanasi'},{id:4,t:'Kashmir Valleys'}],
   'Saudi Arabia':[{id:6,t:'Umrah Pilgrimage'}]
  };
  var byName={};C.forEach(function(c,i){byName[c.n]=i});

  function inRing(r,x,y){var ins=false;for(var i=0,j=r.length-2;i<r.length;j=i,i+=2){var xi=r[i],yi=r[i+1],xj=r[j],yj=r[j+1];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)ins=!ins}return ins}
  function countryAt(lon,lat){
    for(var i=0;i<C.length;i++){var c=C[i],b=c.b;if(lon<b[0]||lon>b[2]||lat<b[1]||lat>b[3])continue;for(var k=0;k<c.p.length;k++)if(inRing(c.p[k],lon,lat))return i}
    var best=-1,bd=2.2; // forgive a near miss on small islands
    for(var j=0;j<C.length;j++)C[j].p.forEach(function(r){for(var m=0;m<r.length;m+=2){var d=Math.hypot((r[m]-lon)*Math.cos(lat*Math.PI/180),r[m+1]-lat);if(d<bd){bd=d;best=j}}});
    return best;
  }

  // ---- texture ----
  var TW=2048,TH=1024,cv=document.createElement('canvas');cv.width=TW;cv.height=TH;var cx=cv.getContext('2d');
  var tex=new THREE.CanvasTexture(cv);tex.anisotropy=4;
  function X(lon){return (lon+180)/360*TW}function Y(lat){return (90-lat)/180*TH}
  function paint(sel){
    cx.fillStyle='#d8e6ff';cx.fillRect(0,0,TW,TH);
    cx.lineWidth=1;cx.lineJoin='round';
    C.forEach(function(c,i){
      var h=(c.n.length*37+c.n.charCodeAt(0)*13)%5;
      cx.fillStyle=i===sel?'#e8531f':PK[c.n]?'#ffd2bd':['#f6f9ff','#eaf1ff','#f1f6fd','#e4eefc','#f3f7ff'][h];
      cx.strokeStyle=i===sel?'#b8380c':'#9db3e3';
      c.p.forEach(function(r){cx.beginPath();for(var k=0;k<r.length;k+=2){var x=X(r[k]),y=Y(r[k+1]);k?cx.lineTo(x,y):cx.moveTo(x,y)}cx.closePath();cx.fill();cx.stroke()});
      if(c.n==='Maldives'){cx.strokeStyle=cx.fillStyle;cx.lineWidth=6;cx.stroke();cx.lineWidth=1}
    });
    tex.needsUpdate=true;
  }
  paint(-1);
  var earth=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.MeshBasicMaterial({map:tex}));
  earth.rotation.y=-Math.PI/2; // line the texture up with the lat/lon helper below
  globe.add(earth);
  var halo=new THREE.Mesh(new THREE.SphereGeometry(1.06,48,32),new THREE.MeshBasicMaterial({color:0xbcd0ff,transparent:true,opacity:.18,side:THREE.BackSide}));
  scene.add(halo);

  // ---- home + routes ----
  var home={n:'Thrissur',lat:10.52,lon:76.21},A=ll(home.lat,home.lon,1);
  var routes=[{lat:25.2,lon:55.3},{lat:4.17,lon:73.51},{lat:12.93,lon:100.88},{lat:28.6,lon:77.2},{lat:34.08,lon:74.8},{lat:21.5,lon:39.2}];
  var hm=new THREE.Mesh(new THREE.SphereGeometry(0.034,16,12),new THREE.MeshBasicMaterial({color:NAVY}));hm.position.copy(ll(home.lat,home.lon,1.01));globe.add(hm);
  var pulse=new THREE.Mesh(new THREE.RingGeometry(0.04,0.05,32),new THREE.MeshBasicMaterial({color:NAVY,transparent:true,opacity:.6,side:THREE.DoubleSide}));
  pulse.position.copy(ll(home.lat,home.lon,1.012));pulse.lookAt(new THREE.Vector3(0,0,0));globe.add(pulse);
  routes.forEach(function(d,i){
    var B=ll(d.lat,d.lon,1),mid=A.clone().add(B).normalize().multiplyScalar(1.12+A.distanceTo(B)*0.32);
    d.c=new THREE.QuadraticBezierCurve3(A.clone().multiplyScalar(1.01),mid,B.clone().multiplyScalar(1.01));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(d.c.getPoints(64)),new THREE.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.7})));
    d.pl=new THREE.Mesh(new THREE.ConeGeometry(0.026,0.09,3),new THREE.MeshBasicMaterial({color:NAVY}));globe.add(d.pl);d.o=i/routes.length;d.s=0.07+0.02*(i%3);
  });

  // ---- UI ----
  var labels=document.getElementById('globe-labels'),chips=document.getElementById('globe-chips'),info=document.getElementById('globe-info'),pick=document.getElementById('globe-country');
  function mk(txt,cls){var e=document.createElement('span');e.className='g-label '+cls;e.textContent=txt;labels.appendChild(e);return e}
  var homeLbl=mk(home.n,'home'),selLbl=mk('','on');selLbl.style.opacity=0;
  var selPos=null,sel=-1;
  C.forEach(function(c,i){var o=document.createElement('option');o.value=i;o.textContent=c.n;pick.appendChild(o)});
  ['Dubai|United Arab Emirates','Maldives|Maldives','Thailand|Thailand','India|India','Umrah (Saudi)|Saudi Arabia'].forEach(function(s){
    var p=s.split('|'),b=document.createElement('button');b.type='button';b.textContent=p[0];b.dataset.c=p[1];b.setAttribute('aria-pressed','false');
    b.addEventListener('click',function(){var i=byName[p[1]];var c=C[i],lo=(c.b[0]+c.b[2])/2,la=(c.b[1]+c.b[3])/2;if(p[1]==='India'){lo=78;la=22}choose(i,lo,la)});chips.appendChild(b)});
  function wa(t){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(t)}
  function render(){
    [].forEach.call(chips.children,function(b){b.setAttribute('aria-pressed',sel>=0&&C[sel].n===b.dataset.c)});
    pick.value=sel>=0?sel:'';
    if(sel<0){info.innerHTML='<strong>Where to next?</strong>Tap any country on the globe, or choose one from the list, to ask us for a package.';return}
    var c=C[sel],p=PK[c.n],h='<strong>'+c.n+'</strong>';
    if(p){h+='We have a package for this trip:<ul>'+p.map(function(x){return '<li><a href="#pkg-'+x.id+'">'+x.t+'</a></li>'}).join('')+'</ul>'}
    else h+='Planning a trip to '+c.n+'? We arrange flights, visa, hotels and tours.';
    h+='<div class="row"><a class="btn btn-wa" target="_blank" rel="noopener" href="'+wa('Hello Fly Guide, I would like a package and quote for '+c.n+'.')+'">Enquire on WhatsApp</a></div>';
    info.innerHTML=h;
  }
  function choose(i,lon,lat){
    if(i===sel){sel=-1;selPos=null;selLbl.style.opacity=0;targetY=null;paint(-1);render();return}
    sel=i;paint(i);selPos=ll(lat,lon,1.01);selLbl.textContent=C[i].n;
    targetY=-lon*Math.PI/180;targetX=Math.max(-.8,Math.min(.8,lat*Math.PI/180*.85));render();
  }
  pick.addEventListener('change',function(){if(pick.value===''){if(sel>=0)choose(sel,0,0);return}var i=+pick.value,c=C[i],lo=(c.b[0]+c.b[2])/2,la=(c.b[1]+c.b[3])/2;if(c.n==='United States of America'){lo=-98;la=39}if(c.n==='Russia'){lo=95;la=60}if(c.n==='France'){lo=2;la=46.5}choose(i,lo,la)});
  render();

  // ---- loop ----
  var up=new THREE.Vector3(0,1,0),reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rotY=-home.lon*Math.PI/180,rotX=0.28,targetY=null,targetX=0,drag=false,lx=0,ly=0,moved=0,visible=true,t0=performance.now(),W=320;
  var tmp=new THREE.Vector3(),camDir=camera.position.clone().normalize(),ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
  function size(){W=box.clientWidth||320;renderer.setSize(W,W,false);camera.aspect=1;camera.updateProjectionMatrix()}
  function place(el,p){tmp.copy(p);globe.localToWorld(tmp);var front=tmp.clone().normalize().dot(camDir)>0.28;tmp.project(camera);el.style.left=((tmp.x+1)/2*W)+'px';el.style.top=((1-tmp.y)/2*W)+'px';el.style.opacity=front?1:0}
  function frame(now){
    var t=(now-t0)/1000;
    if(targetY!==null&&!drag){var dy=targetY-rotY;dy=Math.atan2(Math.sin(dy),Math.cos(dy));rotY+=dy*0.08;rotX+=(targetX-rotX)*0.08;if(Math.abs(dy)<0.002&&Math.abs(targetX-rotX)<0.002)targetY=null}
    else if(!reduce&&!drag&&sel<0){rotY+=0.0022}
    globe.rotation.y=rotY;globe.rotation.x=rotX;halo.rotation.copy(globe.rotation);globe.updateMatrixWorld(true);
    routes.forEach(function(d){var u=(t*d.s+d.o)%1;d.pl.position.copy(d.c.getPoint(u));d.pl.quaternion.setFromUnitVectors(up,d.c.getTangent(u))});
    place(homeLbl,hm.position);if(selPos){place(selLbl,selPos)}
    var k=(t%2)/2;pulse.scale.setScalar(1+k*2.2);pulse.material.opacity=.6*(1-k);
    renderer.render(scene,camera);
  }
  function loop(now){if(visible)frame(now);requestAnimationFrame(loop)}
  size();new ResizeObserver(size).observe(box);
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){visible=e[0].isIntersecting}).observe(box);
  frame(t0);requestAnimationFrame(loop);

  function tap(e){
    var r=renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
    ray.setFromCamera(ndc,camera);var h=ray.intersectObject(earth)[0];if(!h||!h.uv)return;
    var lon=h.uv.x*360-180,lat=h.uv.y*180-90,i=countryAt(lon,lat);
    if(i>=0)choose(i,lon,lat);
  }
  box.addEventListener('pointerdown',function(e){drag=true;moved=0;lx=e.clientX;ly=e.clientY;box.setPointerCapture(e.pointerId)});
  box.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx,dy=e.clientY-ly;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6)targetY=null;rotY+=dx*0.008;rotX=Math.max(-0.9,Math.min(0.9,rotX+dy*0.006));lx=e.clientX;ly=e.clientY});
  box.addEventListener('pointerup',function(e){var was=moved<=6;drag=false;if(was)tap(e)});
  box.addEventListener('pointercancel',function(){drag=false});
})();

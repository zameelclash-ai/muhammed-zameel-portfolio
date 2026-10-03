// 3D globe: flight routes from Thrissur to the places Fly Guide books trips to.
// Tap a destination to turn the globe to it and see the matching package.
(function(){
  var box=document.getElementById('globe');
  if(!box||typeof THREE==='undefined'){if(box)box.classList.add('no-webgl');return}
  var renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){box.classList.add('no-webgl');return}
  var NAVY=0x1a2b6d,ORANGE=0xe8531f,GREY=0xf2b9a3;
  var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,0.1,50);
  camera.position.z=3.55;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  box.appendChild(renderer.domElement);
  var globe=new THREE.Group();scene.add(globe);
  function ll(lat,lon,r){lat*=Math.PI/180;lon*=Math.PI/180;return new THREE.Vector3(r*Math.cos(lat)*Math.sin(lon),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(lon))}

  globe.add(new THREE.Mesh(new THREE.SphereGeometry(1,64,48),new THREE.MeshBasicMaterial({color:0xe3edff})));
  // rough continent blobs: [lat, lon, half-height, half-width]
  var LAND=[[2,22,34,24],[50,15,11,26],[48,90,24,58],[21,79,12,9],[13,105,13,9],[24,46,10,12],[46,-100,22,36],[-14,-60,28,17],[-25,134,12,20],[64,-42,10,18],[60,50,8,30]];
  var pts=[],N=5200,ga=Math.PI*(3-Math.sqrt(5));
  for(var i=0;i<N;i++){
    var y=1-2*(i+.5)/N,rr=Math.sqrt(1-y*y),t=ga*i,x=Math.cos(t)*rr,z=Math.sin(t)*rr;
    var la=Math.asin(y)*180/Math.PI,lo=Math.atan2(x,z)*180/Math.PI,land=false;
    for(var k=0;k<LAND.length&&!land;k++){var e=LAND[k],dl=Math.abs(lo-e[1]);if(dl>180)dl=360-dl;if(Math.pow((la-e[0])/e[2],2)+Math.pow(dl/e[3],2)<1)land=true}
    if(land)pts.push(x*1.004,y*1.004,z*1.004);
  }
  var dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  globe.add(new THREE.Points(dg,new THREE.PointsMaterial({color:0x7f9be0,size:0.021})));
  var lm=new THREE.LineBasicMaterial({color:0xc9d7f3,transparent:true,opacity:.8});
  function ring(pf){globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pf),lm))}
  for(var la1=-60;la1<=60;la1+=30){var a=[];for(var lo1=0;lo1<=360;lo1+=6)a.push(ll(la1,lo1,1.002));ring(a)}
  for(var lo2=0;lo2<180;lo2+=30){var b=[];for(var la2=-90;la2<=90;la2+=6)b.push(ll(la2,lo2,1.002));ring(b)}
  var halo=new THREE.Mesh(new THREE.SphereGeometry(1.06,48,32),new THREE.MeshBasicMaterial({color:0xbcd0ff,transparent:true,opacity:.18,side:THREE.BackSide}));
  scene.add(halo);

  var home={n:'Thrissur',lat:10.52,lon:76.21};
  // pkg = id of the matching package card on the page
  var dest=[
   {n:'Dubai',lat:25.2,lon:55.3,pkg:2,t:'Dubai Highlights',d:'About 4 hours by air. UAE visa help, hotel, city tour and desert safari.'},
   {n:'Maldives',lat:4.17,lon:73.51,pkg:1,t:'Maldives Escape',d:'About 1.5 hours by air. Resort stay, transfers and island activities.'},
   {n:'Pattaya',lat:12.93,lon:100.88,pkg:3,t:'Pattaya Paradise',d:'About 4 hours by air to Bangkok, then a road transfer. Beach, coral island and city.'},
   {n:'Delhi',lat:28.6,lon:77.2,pkg:5,t:'Delhi · Agra · Varanasi',d:'About 3 hours by air. Group tour with Taj Mahal and the Ganga aarti.'},
   {n:'Kashmir',lat:34.08,lon:74.8,pkg:4,t:'Kashmir Valleys',d:'Fly to Srinagar via Delhi. Dal Lake, Gulmarg and Pahalgam.'},
   {n:'Jeddah',lat:21.5,lon:39.2,pkg:6,t:'Umrah Pilgrimage',d:'About 5.5 hours by air. Visa, flights, hotels and guided ziyarat.'}
  ];
  var A=ll(home.lat,home.lon,1);
  function dot(p,c,s){var m=new THREE.Mesh(new THREE.SphereGeometry(s,16,12),new THREE.MeshBasicMaterial({color:c,transparent:true}));m.position.copy(p);globe.add(m);return m}
  dot(ll(home.lat,home.lon,1.01),NAVY,0.034);
  var pulse=new THREE.Mesh(new THREE.RingGeometry(0.04,0.05,32),new THREE.MeshBasicMaterial({color:NAVY,transparent:true,opacity:.6,side:THREE.DoubleSide}));
  pulse.position.copy(ll(home.lat,home.lon,1.012));pulse.lookAt(new THREE.Vector3(0,0,0));globe.add(pulse);

  dest.forEach(function(d,i){
    var B=ll(d.lat,d.lon,1);d.mk=dot(ll(d.lat,d.lon,1.008),ORANGE,0.024);d.pos=ll(d.lat,d.lon,1.01);
    var mid=A.clone().add(B).normalize().multiplyScalar(1+0.12+A.distanceTo(B)*0.32);
    d.c=new THREE.QuadraticBezierCurve3(A.clone().multiplyScalar(1.01),mid,B.clone().multiplyScalar(1.01));
    d.lm=new THREE.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.75});
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(d.c.getPoints(64)),d.lm));
    d.pl=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.1,3),new THREE.MeshBasicMaterial({color:NAVY,transparent:true}));
    globe.add(d.pl);d.o=i/dest.length;d.s=0.07+0.02*(i%3);
  });

  // HTML labels, chips, info card
  var labels=document.getElementById('globe-labels'),chips=document.getElementById('globe-chips'),info=document.getElementById('globe-info');
  function mkLabel(txt,cls){var el=document.createElement('span');el.className='g-label '+cls;el.textContent=txt;labels.appendChild(el);return el}
  var homeLabel=mkLabel(home.n,'home');
  dest.forEach(function(d){d.lbl=mkLabel(d.n,'')});
  var sel=-1;
  function showInfo(){
    if(sel<0){info.innerHTML='<strong>Flying from Thrissur</strong>Tap a destination to see the trip we plan for it.';return}
    var d=dest[sel];info.innerHTML='<strong>'+d.t+'</strong>'+d.d+'<a href="#pkg-'+d.pkg+'">See this package →</a>';
  }
  function select(i){
    sel=(sel===i)?-1:i;
    [].forEach.call(chips.children,function(b,j){b.setAttribute('aria-pressed',j===sel)});
    dest.forEach(function(d,j){var on=sel<0||j===sel;d.lm.opacity=on?(j===sel?1:.75):.15;d.mk.material.opacity=on?1:.3;d.pl.material.opacity=on?1:.2;d.mk.scale.setScalar(j===sel?1.7:1);d.lbl.classList.toggle('on',j===sel)});
    if(sel>=0){targetY=-dest[sel].lon*Math.PI/180;targetX=Math.max(-.7,Math.min(.7,dest[sel].lat*Math.PI/180*.8));auto=false}
    showInfo();
  }
  dest.forEach(function(d,i){var b=document.createElement('button');b.type='button';b.textContent=d.n;b.setAttribute('aria-pressed','false');b.addEventListener('click',function(){select(i)});chips.appendChild(b)});
  showInfo();

  var up=new THREE.Vector3(0,1,0),reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rotY=-home.lon*Math.PI/180,rotX=0.28,targetY=null,targetX=null,auto=!reduce,drag=false,lx=0,ly=0,visible=true,t0=performance.now(),W=320;
  var tmp=new THREE.Vector3(),camDir=camera.position.clone().normalize();
  function size(){W=box.clientWidth||320;renderer.setSize(W,W,false);camera.aspect=1;camera.updateProjectionMatrix()}
  function place(el,p){
    tmp.copy(p);globe.localToWorld(tmp);
    var front=tmp.clone().normalize().dot(camDir)>0.28;
    tmp.project(camera);
    el.style.left=((tmp.x+1)/2*W)+'px';el.style.top=((1-tmp.y)/2*W)+'px';el.style.opacity=front?1:0;
  }
  function frame(now){
    var t=(now-t0)/1000;
    if(targetY!==null&&!drag){
      var dy=targetY-rotY;dy=Math.atan2(Math.sin(dy),Math.cos(dy));
      rotY+=dy*0.08;rotX+=(targetX-rotX)*0.08;
      if(Math.abs(dy)<0.002&&Math.abs(targetX-rotX)<0.002)targetY=null;
    }else if(auto&&!drag){rotY+=0.0022}
    globe.rotation.y=rotY;globe.rotation.x=rotX;halo.rotation.copy(globe.rotation);globe.updateMatrixWorld(true);
    dest.forEach(function(d){
      var u=(t*d.s+d.o)%1;d.pl.position.copy(d.c.getPoint(u));d.pl.quaternion.setFromUnitVectors(up,d.c.getTangent(u));
      place(d.lbl,d.pos);
    });
    place(homeLabel,ll(home.lat,home.lon,1.01));
    var k=(t%2)/2;pulse.scale.setScalar(1+k*2.2);pulse.material.opacity=.6*(1-k);
    renderer.render(scene,camera);
  }
  function loop(now){if(visible)frame(now);requestAnimationFrame(loop)}
  size();new ResizeObserver(size).observe(box);
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){visible=e[0].isIntersecting}).observe(box);
  frame(t0);requestAnimationFrame(loop);

  box.addEventListener('pointerdown',function(e){drag=true;targetY=null;lx=e.clientX;ly=e.clientY;box.setPointerCapture(e.pointerId)});
  box.addEventListener('pointermove',function(e){if(!drag)return;rotY+=(e.clientX-lx)*0.008;rotX=Math.max(-0.9,Math.min(0.9,rotX+(e.clientY-ly)*0.006));lx=e.clientX;ly=e.clientY});
  ['pointerup','pointercancel'].forEach(function(n){box.addEventListener(n,function(){drag=false})});
})();

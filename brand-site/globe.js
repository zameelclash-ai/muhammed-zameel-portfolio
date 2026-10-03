// 3D globe: flight routes from Thrissur to the places Fly Guide books trips to.
(function(){
  var box=document.getElementById('globe');
  if(!box||typeof THREE==='undefined'){if(box)box.classList.add('no-webgl');return}
  var renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){box.classList.add('no-webgl');return}
  var NAVY=0x1a2b6d,ORANGE=0xe8531f;
  var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,0.1,50);
  camera.position.z=3.55;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  box.appendChild(renderer.domElement);
  var globe=new THREE.Group();scene.add(globe);

  function ll(lat,lon,r){lat*=Math.PI/180;lon*=Math.PI/180;return new THREE.Vector3(r*Math.cos(lat)*Math.sin(lon),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(lon))}

  // body, soft blue
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(1,64,48),new THREE.MeshBasicMaterial({color:0xe3edff})));
  // dotted "land" using a smooth noise mask over a fibonacci grid
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
  // graticule
  var lm=new THREE.LineBasicMaterial({color:0xc9d7f3,transparent:true,opacity:.8});
  function ring(pf){var g=new THREE.BufferGeometry().setFromPoints(pf);globe.add(new THREE.Line(g,lm))}
  for(var la=-60;la<=60;la+=30){var a=[];for(var lo=0;lo<=360;lo+=6)a.push(ll(la,lo,1.002));ring(a)}
  for(var lo2=0;lo2<180;lo2+=30){var b=[];for(var la2=-90;la2<=90;la2+=6)b.push(ll(la2,lo2,1.002));ring(b)}
  // atmosphere halo
  var halo=new THREE.Mesh(new THREE.SphereGeometry(1.06,48,32),new THREE.MeshBasicMaterial({color:0xbcd0ff,transparent:true,opacity:.18,side:THREE.BackSide}));
  scene.add(halo);

  var home={n:'Thrissur',lat:10.52,lon:76.21};
  var dest=[{n:'Dubai',lat:25.2,lon:55.3},{n:'Maldives',lat:4.17,lon:73.51},{n:'Bangkok',lat:13.75,lon:100.5},{n:'Delhi',lat:28.6,lon:77.2},{n:'Jeddah',lat:21.5,lon:39.2},{n:'Singapore',lat:1.35,lon:103.8},{n:'Srinagar',lat:34.08,lon:74.8}];
  var A=ll(home.lat,home.lon,1);
  var dot=function(p,c,s){var m=new THREE.Mesh(new THREE.SphereGeometry(s,16,12),new THREE.MeshBasicMaterial({color:c}));m.position.copy(p);globe.add(m);return m};
  dot(ll(home.lat,home.lon,1.01),NAVY,0.034);
  var pulse=new THREE.Mesh(new THREE.RingGeometry(0.04,0.05,32),new THREE.MeshBasicMaterial({color:NAVY,transparent:true,opacity:.6,side:THREE.DoubleSide}));
  pulse.position.copy(ll(home.lat,home.lon,1.012));pulse.lookAt(new THREE.Vector3(0,0,0));globe.add(pulse);

  var planes=[];
  dest.forEach(function(d,i){
    var B=ll(d.lat,d.lon,1);dot(ll(d.lat,d.lon,1.008),ORANGE,0.022);
    var mid=A.clone().add(B).normalize().multiplyScalar(1+0.12+A.distanceTo(B)*0.32);
    var curve=new THREE.QuadraticBezierCurve3(A.clone().multiplyScalar(1.01),mid,B.clone().multiplyScalar(1.01));
    var g=new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
    globe.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.8})));
    var pl=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.1,3),new THREE.MeshBasicMaterial({color:NAVY}));
    globe.add(pl);planes.push({m:pl,c:curve,o:i/dest.length,s:0.07+0.02*(i%3)});
  });

  var up=new THREE.Vector3(0,1,0),reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rotY=-home.lon*Math.PI/180,rotX=0.28,drag=false,lx=0,ly=0,idle=0,visible=true,t0=performance.now();
  function size(){var w=box.clientWidth||320;renderer.setSize(w,w,false);camera.aspect=1;camera.updateProjectionMatrix()}
  function frame(now){
    var t=(now-t0)/1000;
    if(!drag){idle++;if(!reduce)rotY+=0.0022}
    globe.rotation.y=rotY;globe.rotation.x=rotX;halo.rotation.copy(globe.rotation);
    planes.forEach(function(p){
      var u=(t*p.s+p.o)%1,pos=p.c.getPoint(u),tan=p.c.getTangent(u);
      p.m.position.copy(pos);p.m.quaternion.setFromUnitVectors(up,tan);
    });
    var k=(t%2)/2;pulse.scale.setScalar(1+k*2.2);pulse.material.opacity=.6*(1-k);
    renderer.render(scene,camera);
  }
  function loop(now){if(visible)frame(now);requestAnimationFrame(loop)}
  size();new ResizeObserver(size).observe(box);
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){visible=e[0].isIntersecting}).observe(box);
  frame(t0);requestAnimationFrame(loop);

  box.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;ly=e.clientY;box.setPointerCapture(e.pointerId)});
  box.addEventListener('pointermove',function(e){if(!drag)return;rotY+=(e.clientX-lx)*0.008;rotX=Math.max(-0.9,Math.min(0.9,rotX+(e.clientY-ly)*0.006));lx=e.clientX;ly=e.clientY});
  ['pointerup','pointercancel'].forEach(function(n){box.addEventListener(n,function(){drag=false})});
})();

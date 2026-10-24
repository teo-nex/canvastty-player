(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,17405,e=>{"use strict";var t=e.i(43476),n=e.i(71645);let r=`#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`,i=`#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform float time, impulse, night;
uniform vec2 pointer;
uniform vec3 pigment, secondary;
uniform vec3 audioMotion;
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float field(vec3 p){
  p.xz=turn(pointer.x*.28+sin(time*.23)*.18)*p.xz;
  p.yz=turn(pointer.y*.23+cos(time*.17)*.2)*p.yz;
  p.xy=turn(time*.1+audioMotion.y*.22)*p.xy;
  float a=atan(p.y,p.x);
  float swell=sin(a*3.+time*.65)*(.075+audioMotion.y*.11)+cos(a*5.-time*.35)*(.025+audioMotion.z*.035);
  float ring=length(vec2(length(p.xy)-(1.02+swell+audioMotion.x*.07),p.z-sin(a*2.+time*.4)*(.21+audioMotion.y*.16)))-(.235+impulse*.095+audioMotion.x*.11);
  vec3 b=vec3(cos(time*.42)*(1.17+audioMotion.x*.09),sin(time*.42)*1.17,cos(time*.51)*(.26+audioMotion.y*.22));
  vec3 c=vec3(cos(-time*.31+2.)*1.12,sin(-time*.31+2.)*1.12,sin(time*.47)*(.35+audioMotion.z*.2));
  ring=smin(ring,length(p-b)-(.32+audioMotion.y*.08),.38);
  ring=smin(ring,length(p-c)-(.26+audioMotion.x*.07),.32);
  ring+=sin(p.x*5.+time)*sin(p.y*4.-time*.7)*sin(p.z*5.)*(.016+audioMotion.z*.025);
  return ring;
}
vec3 normalAt(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(field(p+e.xyy)-field(p-e.xyy),field(p+e.yxy)-field(p-e.yxy),field(p+e.yyx)-field(p-e.yyx)));}
vec3 studio(vec3 r){
  vec3 low=mix(vec3(.12,.1,.17),vec3(.025,.03,.06),night);
  vec3 env=mix(low,secondary*.75,smoothstep(-.4,.9,r.y));
  float box=pow(max(dot(r,normalize(vec3(-.7,.9,1.))),0.),48.);
  float strip=pow(max(dot(r,normalize(vec3(.9,.1,1.))),0.),110.);
  float edge=pow(max(dot(r,normalize(vec3(-1.,-.4,-.6))),0.),20.);
  env+=vec3(1.,.94,.87)*box*3.2;
  env+=vec3(.92,.93,1.)*strip*3.8;
  return env+pigment*edge*1.8;
}
void main(){
  vec2 screen=(uv-.5)*2.;
  vec3 ro=vec3(0.,0.,4.8),rd=normalize(vec3(screen*1.22,-3.5));
  float travel=0.;vec3 p=ro;bool hit=false;
  for(int i=0;i<72;i++){
    p=ro+rd*travel;float d=field(p);
    if(d<.0018){hit=true;break;}
    travel+=max(d*.8,.001);if(travel>7.)break;
  }
  if(!hit){color=vec4(0.);return;}
  vec3 n=normalAt(p),v=-rd,l=normalize(vec3(-.6,1.,1.4));
  float diffuse=max(0.,dot(n,l));
  float fresnel=pow(1.-max(0.,dot(n,v)),3.);
  float ao=clamp(field(p+n*.15)/.15,.2,1.);
  vec3 base=mix(pigment,secondary,smoothstep(-.8,.9,p.y+sin(p.x*2.+time*.18)*.3));
  vec3 reflected=studio(reflect(rd,n));
  vec3 shaded=base*(.13+diffuse*.47)*ao+reflected*(.65+fresnel*.6);
  shaded+=vec3(1.,.96,.92)*pow(max(0.,dot(n,normalize(l+v))),110.)*2.;
  shaded=mix(shaded,secondary,fresnel*.17);
  shaded=shaded/(shaded+vec3(.62));
  color=vec4(pow(shaded,vec3(.88)),1.);
}`,o=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16)/255);e.s(["WowSculpture",0,function(e){let a=(0,n.useRef)(null),c=(0,n.useRef)(e);return(0,n.useLayoutEffect)(()=>{c.current=e,a.current?.dispatchEvent(new Event("sculpture-change"))},[e.tone,e.accent,e.soft,e.trackId,e.playing]),(0,n.useEffect)(()=>{let t=a.current;if(!t)return;let n=t.getContext("webgl2",{alpha:!0,antialias:!1,premultipliedAlpha:!1});if(!n)return;let l=t.closest(".site"),d=matchMedia("(prefers-reduced-motion: reduce)"),s=null,m=null,u=[],v={},f=0,p=0,h=0,g=0,y=+("night"===e.tone),x=e.trackId,w=!1,E={x:0,y:0,tx:0,ty:0},b=o(e.accent),A=o(e.soft),M=new Float32Array(3),L=()=>{m&&n.deleteBuffer(m),s&&n.deleteProgram(s),u.forEach(e=>n.deleteShader(e)),u=[],s=null,m=null},S=()=>{try{let e=(e,t)=>{let r=n.createShader(e);if(!r)throw Error("Shader allocation failed");if(u.push(r),n.shaderSource(r,t),n.compileShader(r),!n.getShaderParameter(r,n.COMPILE_STATUS))throw Error(n.getShaderInfoLog(r)??"Shader compile failed");return r};if(!(s=n.createProgram()))throw Error("Program allocation failed");if(n.attachShader(s,e(n.VERTEX_SHADER,r)),n.attachShader(s,e(n.FRAGMENT_SHADER,i)),n.linkProgram(s),!n.getProgramParameter(s,n.LINK_STATUS))throw Error("Shader link failed");n.useProgram(s),m=n.createBuffer(),n.bindBuffer(n.ARRAY_BUFFER,m),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW);let o=n.getAttribLocation(s,"position");n.enableVertexAttribArray(o),n.vertexAttribPointer(o,2,n.FLOAT,!1,0,0),v=Object.fromEntries(["time","impulse","pointer","pigment","secondary","night","audioMotion"].map(e=>[e,n.getUniformLocation(s,e)])),t.dataset.ready="true"}catch(e){console.warn("3D material unavailable; player remains available.",e),L(),t.dataset.ready="false"}},R=e=>{if(f=0,!s||w||document.hidden)return;if(p&&e-p<30&&!d.matches){f=requestAnimationFrame(R);return}let r=Math.min((e-(p||e))/1e3,.08);p=e;let i=d.matches?1:1-Math.exp(-(5*r)),a=document.documentElement.hasAttribute("data-wow-transition")?1:i;d.matches||(h+=r*(c.current.playing?1:.55)),g*=Math.exp(-(2.6*r));for(let e=0;e<3;e++){let t=c.current.playing&&!d.matches?c.current.audioMotion.current[e]:0;M[e]=d.matches?0:M[e]+(t-M[e])*(1-Math.exp(-r*(t>M[e]?40:8)))}E.x+=(E.tx-E.x)*i,E.y+=(E.ty-E.y)*i;let l=o(c.current.accent),m=o(c.current.soft);for(let e=0;e<3;e++)b[e]+=(l[e]-b[e])*a,A[e]+=(m[e]-A[e])*a;y+=(("night"===c.current.tone)-y)*a,n.viewport(0,0,t.width,t.height),n.useProgram(s),n.uniform1f(v.time,h),n.uniform1f(v.impulse,d.matches?0:g),n.uniform1f(v.night,y),n.uniform3fv(v.audioMotion,M),n.uniform2f(v.pointer,d.matches?0:E.x,d.matches?0:E.y),n.uniform3fv(v.pigment,b),n.uniform3fv(v.secondary,A),n.drawArrays(n.TRIANGLES,0,3),d.matches||(f=requestAnimationFrame(R))},z=()=>{f||document.hidden||w||(f=requestAnimationFrame(R))},F=()=>{let e=Math.min(720,Math.round(t.getBoundingClientRect().width*Math.min(devicePixelRatio||1,1.4)));t.width=t.height=Math.max(1,e),z()},P=e=>{if(d.matches||"touch"===e.pointerType)return;let n=t.getBoundingClientRect();E.tx=Math.max(-1,Math.min(1,(e.clientX-n.left)/n.width*2-1)),E.ty=Math.max(-1,Math.min(1,(e.clientY-n.top)/n.height*2-1))},T=()=>{E.tx=E.ty=0},k=()=>{x!==c.current.trackId&&(g=1,x=c.current.trackId),z()},I=()=>{cancelAnimationFrame(f),f=0,p=0,R(performance.now()),n.flush()},B=()=>{cancelAnimationFrame(f),f=0,p=0,z()},_=e=>{e.preventDefault(),w=!0,cancelAnimationFrame(f),f=0,t.dataset.ready="false"},C=()=>{w=!1,L(),S(),F()};S();let U=new ResizeObserver(F);return U.observe(t),window.addEventListener("pointermove",P,{passive:!0}),window.addEventListener("blur",T),document.documentElement.addEventListener("pointerleave",T),document.addEventListener("visibilitychange",B),d.addEventListener("change",z),t.addEventListener("sculpture-change",k),t.addEventListener("webglcontextlost",_),t.addEventListener("webglcontextrestored",C),l?.addEventListener("wow-palette-capture",I),()=>{cancelAnimationFrame(f),U.disconnect(),L(),window.removeEventListener("pointermove",P),window.removeEventListener("blur",T),document.documentElement.removeEventListener("pointerleave",T),document.removeEventListener("visibilitychange",B),d.removeEventListener("change",z),t.removeEventListener("sculpture-change",k),t.removeEventListener("webglcontextlost",_),t.removeEventListener("webglcontextrestored",C),l?.removeEventListener("wow-palette-capture",I)}},[]),(0,t.jsx)("canvas",{ref:a,className:"wow-sculpture","data-module":"wow-sculpture","aria-hidden":"true"})}])},25152,e=>{e.n(e.i(17405))}]);
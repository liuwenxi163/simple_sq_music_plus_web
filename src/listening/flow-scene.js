import vertex from '../vendor/react-bits/grainient/vertex.glsl?raw'
import fieldShader from '../vendor/react-bits/grainient/field.glsl?raw'
import compositeShader from '../vendor/react-bits/grainient/composite.glsl?raw'
import {toOklch} from '../vendor/react-bits/aurora/shaders.js'
/*! React Bits Grainient, Copyright (c) 2026 David Haz. MIT + Commons Clause. /licenses/react-bits.txt */
// Original two-pass shaders, driven by the player's real audio. No additional animation loop.
export function createFlow(canvas){
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});if(!gl)return null
 let field,composite,texture,framebuffer,vao,disposed=false,lost=false,w=0,h=0,key='',time=1.2,last=0
 const programs=[],shaders=[],ramp=new Float32Array(24)
 function lose(e){e.preventDefault();lost=true}
 function dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lose);if(lost)return;if(texture)gl.deleteTexture(texture);if(framebuffer)gl.deleteFramebuffer(framebuffer);if(vao)gl.deleteVertexArray(vao);programs.forEach(p=>gl.deleteProgram(p));shaders.forEach(s=>gl.deleteShader(s))}
 canvas.addEventListener('webglcontextlost',lose)
 try{
  const link=source=>{const p=gl.createProgram();programs.push(p);for(const [type,text] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,source]]){const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,text);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Flow shader');gl.attachShader(p,shader)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('Flow program');const u={};for(let i=0;i<gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);i++){const name=gl.getActiveUniform(p,i).name;u[name.replace(/\[0\]$/,'')]=gl.getUniformLocation(p,name)}return {p,u}}
  field=link(fieldShader);composite=link(compositeShader);vao=gl.createVertexArray();texture=gl.createTexture();framebuffer=gl.createFramebuffer();gl.bindTexture(gl.TEXTURE_2D,texture)
  for(const [a,b] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,a,b)
  gl.useProgram(field.p);gl.uniform1i(field.u.uCount,4);gl.uniform1i(field.u.uType,1);gl.uniform2f(field.u.uDir,.819,.574);gl.uniform2f(field.u.uSeed,.8,2.1)
  for(const [a,b] of Object.entries({uBands:1,uSoftness:.9,uScale:1.08,uSilk:0,uContrast:1.04,uSaturation:.85,uSettle:1,uReveal:1}))gl.uniform1f(field.u[a],b)
  gl.uniform4fv(field.u.uStir,new Float32Array(96));gl.uniform1fv(field.u.uStirWeight,new Float32Array(24));gl.uniform4fv(field.u.uTwirl,new Float32Array(16))
  gl.useProgram(composite.p);gl.uniform1f(composite.u.uGrain,.016);gl.uniform1f(composite.u.uGrainSize,1.2);gl.uniform1f(composite.u.uFrame,0)
  return {draw(s,palette,now){
   if(disposed||lost)return false
   const stamp=palette.flat().join(',');if(stamp!==key){key=stamp;const colors=[[.035,.05,.085],...palette.map(c=>c.map(v=>.025+v*.5))];colors.forEach((rgb,i)=>{const [L,C,H]=toOklch(rgb);ramp.set([L,C*Math.cos(H),C*Math.sin(H)],i*3)})}
   const dt=last&&s.live?Math.max(0,Math.min(1,(now-last)/1000)):0;last=s.live?now:0;time+=dt*(.5+(s.energy||0)*1.4)
   if(w!==canvas.width||h!==canvas.height){w=canvas.width;h=canvas.height;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,Math.max(1,w>>1),Math.max(1,h>>1),0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)return false}
   gl.bindVertexArray(vao);gl.disable(gl.BLEND);gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(0,0,Math.max(1,w>>1),Math.max(1,h>>1));gl.useProgram(field.p);gl.uniform3fv(field.u.uRamp,ramp);gl.uniform1f(field.u.uAspect,w/h);gl.uniform1f(field.u.uExtent,w/h*.819+.574);gl.uniform1f(field.u.uTime,time);gl.uniform1f(field.u.uFlow,2.2+(s.live?s.bass:0)*1.2);gl.drawArrays(gl.TRIANGLES,0,3)
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.useProgram(composite.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(composite.u.uField,0);gl.drawArrays(gl.TRIANGLES,0,3);return true
  },dispose}
 }catch{dispose();return null}
}

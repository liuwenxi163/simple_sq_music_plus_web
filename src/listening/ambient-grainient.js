import vertex from '../vendor/react-bits/grainient/vertex.glsl?raw'
import fieldShader from '../vendor/react-bits/grainient/field.glsl?raw'
import compositeShader from '../vendor/react-bits/grainient/composite.glsl?raw'

/*! React Bits Grainient, Copyright (c) 2026 David Haz. MIT + Commons Clause. See /licenses/react-bits.txt. */
const linear = v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4
function toLab(hex) {
  const [r,g,b] = [1,3,5].map(offset => linear(parseInt(hex.slice(offset,offset+2),16)/255))
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b)
  const m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b)
  const s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b)
  return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s]
}

// Original two-pass shader; a quiet radial field, silk lighting and pointer swirls off.
export function mountGrainient(canvas,{active=true}={}) {
  let gl,field,composite,vao,texture,framebuffer,raf=0,disposed=false,failed=false
  let running=active,last=0,previousDraw=0,time=1.2,fieldWidth=1,fieldHeight=1
  const programs=[],shaders=[],motion=matchMedia('(prefers-reduced-motion: reduce)')
  const ramp=new Float32Array(24),palette=['#111b2d','#3b6278','#3d4a71','#69678d']
  palette.forEach((color,i)=>ramp.set(toLab(color),i*3))
  function release(){
    cancelAnimationFrame(raf);raf=0
    if(gl&&!gl.isContextLost()){
      if(texture)gl.deleteTexture(texture)
      if(framebuffer)gl.deleteFramebuffer(framebuffer)
      if(vao)gl.deleteVertexArray(vao)
      programs.forEach(p=>gl.deleteProgram(p));shaders.forEach(s=>gl.deleteShader(s))
    }
    programs.length=0;shaders.length=0;field=null;composite=null;vao=null;texture=null;framebuffer=null
  }
  function fallback(){failed=true;release();canvas.dataset.renderer='fallback'}
  function draw(){
    if(disposed||failed||document.hidden||!field||!composite)return
    gl.bindVertexArray(vao);gl.disable(gl.BLEND)
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(0,0,fieldWidth,fieldHeight)
    gl.useProgram(field.program)
    gl.uniform1f(field.u.uAspect,canvas.width/canvas.height)
    gl.uniform1f(field.u.uTime,time)
    gl.uniform1f(field.u.uExtent,canvas.width/canvas.height*.819+.574)
    gl.drawArrays(gl.TRIANGLES,0,3)
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height)
    gl.useProgram(composite.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture)
    gl.uniform1i(composite.u.uField,0);gl.drawArrays(gl.TRIANGLES,0,3)
    canvas.dataset.renderer='webgl2';canvas.dataset.effect='grainient'
  }
  function resize(){
    if(!gl||disposed||failed)return
    const r=canvas.getBoundingClientRect(),mobile=r.width<760
    const ratio=Math.min(devicePixelRatio||1,mobile ? .75 : 1,Math.sqrt((mobile?480000:1100000)/Math.max(1,r.width*r.height)))
    canvas.width=Math.max(1,Math.floor(r.width*ratio));canvas.height=Math.max(1,Math.floor(r.height*ratio))
    fieldWidth=Math.max(1,Math.round(canvas.width/2));fieldHeight=Math.max(1,Math.round(canvas.height/2))
    gl.bindTexture(gl.TEXTURE_2D,texture)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,fieldWidth,fieldHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0)
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){fallback();return}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);draw()
  }
  function tick(now){
    raf=0;if(disposed||failed||!running||document.hidden||motion.matches)return
    if(!previousDraw||now-previousDraw>=1000/24){
      const dt=last?Math.min((now-last)/1000,.12):0;last=now;previousDraw=now;time+=dt*.055;draw()
    }
    raf=requestAnimationFrame(tick)
  }
  function resume(){
    cancelAnimationFrame(raf);raf=0;last=0;previousDraw=0
    canvas.dataset.motion=motion.matches?'reduced':running&&!document.hidden?'playing':'paused'
    if(disposed||failed||document.hidden||!running)return
    draw();if(!motion.matches)raf=requestAnimationFrame(tick)
  }
  function initialize(){
    gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'})
    if(!gl){fallback();return}
    const compile=(type,source)=>{
      const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s)
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Ambient shader unavailable')
      return s
    }
    const link=source=>{
      const p=gl.createProgram();programs.push(p)
      gl.attachShader(p,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,source));gl.linkProgram(p)
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('Ambient program unavailable')
      const u={};for(let i=0;i<gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);i++){
        const name=gl.getActiveUniform(p,i).name;u[name.replace(/\[0\]$/,'')]=gl.getUniformLocation(p,name)
      }
      return {program:p,u}
    }
    field=link(fieldShader);composite=link(compositeShader);vao=gl.createVertexArray()
    texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture)
    for(const [name,value] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,name,value)
    framebuffer=gl.createFramebuffer();gl.useProgram(field.program)
    gl.uniform3fv(field.u.uRamp,ramp);gl.uniform1i(field.u.uCount,palette.length);gl.uniform1i(field.u.uType,1)
    gl.uniform2f(field.u.uDir,.819,.574);gl.uniform2f(field.u.uSeed,.8,2.1)
    for(const [key,value] of Object.entries({uBands:1,uSoftness:1,uFlow:1.1,uScale:1.25,uSilk:0,uContrast:.96,uSaturation:.85,uSettle:1,uReveal:1}))gl.uniform1f(field.u[key],value)
    gl.uniform4fv(field.u.uStir,new Float32Array(96));gl.uniform1fv(field.u.uStirWeight,new Float32Array(24));gl.uniform4fv(field.u.uTwirl,new Float32Array(16))
    gl.useProgram(composite.program);gl.uniform1f(composite.u.uGrain,.025);gl.uniform1f(composite.u.uGrainSize,1.2);gl.uniform1f(composite.u.uFrame,0)
    failed=false;resize();resume()
  }
  function lost(event){event.preventDefault();fallback()}
  function restored(){if(!disposed){try{initialize()}catch{fallback()}}}
  canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored)
  document.addEventListener('visibilitychange',resume);motion.addEventListener('change',resume);window.addEventListener('resize',resize,{passive:true})
  try{initialize()}catch{fallback()}
  return {
    setActive(value){running=!!value;resume()},
    dispose(){disposed=true;release();canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);document.removeEventListener('visibilitychange',resume);motion.removeEventListener('change',resume);window.removeEventListener('resize',resize)}
  }
}

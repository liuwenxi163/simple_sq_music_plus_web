import { VERTEX, FRAGMENT, toOklch, unwrapHues } from '../vendor/react-bits/aurora/shaders.js'

export function auroraResponse(s,mode){
  const live=s.live&&mode!=='still',e=live?s.energy:0,b=live?s.bass:0,h=live?s.highs:0
  return {amplitude:.75+Math.sqrt(b)*2.4,brightness:.64+Math.sqrt(e)*.65,glow:.4+h*.75,pace:live ? .9+e*2+b*.8 : 0,height:mode==='curtain'?.48:.36,opacity:mode==='spectrum'?.4:.78}
}
export function createAurora(canvas){
  const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});if(!gl)return null
  const shaders=[];let program,buffer,vao,disposed=false,lost=false,clock=5,last=0,key='',palette=new Float32Array(15)
  function dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lose);if(!lost){if(vao)gl.deleteVertexArray(vao);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);for(const shader of shaders)gl.deleteShader(shader)}}
  function lose(e){e.preventDefault();lost=true}
  canvas.addEventListener('webglcontextlost',lose)
  try{
    for(const [type,source] of [[gl.VERTEX_SHADER,VERTEX],[gl.FRAGMENT_SHADER,FRAGMENT]]){const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Shader unavailable')}
    program=gl.createProgram();for(const shader of shaders)gl.attachShader(program,shader);gl.bindAttribLocation(program,0,'aPosition');gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader unavailable')
    buffer=gl.createBuffer();vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0)
    const names=['uResolution','uTime','uStops[0]','uStopCount','uAmplitude','uBlend','uHeight','uScale','uGlow','uBrightness','uLayers','uFlip','uPointer','uReveal','uOpacity','uLightMode'],u=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,n)]))
    return {draw(s,colors,mode,now){
      if(disposed||lost)return false
      const stamp=colors.flat().join(',');if(stamp!==key){key=stamp;unwrapHues(colors.map(toOklch)).forEach((c,i)=>palette.set(c,i*3))}
      const v=auroraResponse(s,mode),dt=v.pace&&last?Math.min(1,Math.max(0,(now-last)/1000)):0;last=v.pace?now:0;clock+=dt*v.pace
      gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.bindVertexArray(vao);gl.uniform2f(u.uResolution,canvas.width,canvas.height);gl.uniform1f(u.uTime,clock);gl.uniform3fv(u['uStops[0]'],palette);gl.uniform1i(u.uStopCount,3);gl.uniform1f(u.uAmplitude,v.amplitude);gl.uniform1f(u.uBlend,.65);gl.uniform1f(u.uHeight,v.height);gl.uniform1f(u.uScale,1.1);gl.uniform1f(u.uGlow,v.glow);gl.uniform1f(u.uBrightness,v.brightness);gl.uniform1i(u.uLayers,2);gl.uniform1f(u.uFlip,1);gl.uniform3f(u.uPointer,0,.5,0);gl.uniform1f(u.uReveal,1);gl.uniform1f(u.uOpacity,mode==='still'?.2:v.opacity);gl.uniform1f(u.uLightMode,0);gl.drawArrays(gl.TRIANGLES,0,3);return true
    },dispose}
  }catch{dispose();return null}
}

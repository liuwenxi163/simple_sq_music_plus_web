export const vertexShader = `
attribute vec2 a_position;
void main(){gl_Position=vec4(a_position,0.0,1.0);}
`

export const fragmentShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_energy;
uniform float u_spectrum;
uniform float u_style;
uniform vec2 u_band;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;
uniform sampler2D u_audio;
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.0,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+7.1;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/u_resolution;
 vec2 p=(uv-.5)*vec2(u_resolution.x/u_resolution.y,1.0)*2.0;
 float t=u_time*.075;
 vec2 q=vec2(fbm(p*.64+vec2(t,-t*.4)),fbm(p*.67+vec2(2.8,-t*.55)));
 float f=fbm(p*.9+q*2.7+vec2(-t*.28,t*.42));
 float fold=sin(p.x*.85+t*.6+f*2.6)*.35;
 float silk=exp(-pow((p.y+fold+.12)*1.5,2.0));
 float bloom=exp(-length(p-vec2(-.8,.15))*.65);
 vec3 pigment=mix(u_colorA,u_colorB,smoothstep(.15,.8,f));
 pigment=mix(pigment,u_colorC,smoothstep(.32,.72,q.y)*.65);
 vec3 col=vec3(.018,.023,.032)+pigment*(.12+silk*.27+bloom*.2+u_energy*.13);
 col+=u_colorA*pow(max(0.0,1.0-abs(f-.49)*6.0),3.0)*silk*.12;
 float edge=1.0-smoothstep(.12,1.45,length((uv-.5)*vec2(1.0,.9)));
 col*=.3+edge*.7;
 if(u_style>.5 && u_style<1.5){
   float curtain=sin(p.x*3.0+fbm(p*.5+vec2(t*.3,0.0))*5.0+t)*.38;
   float light=exp(-abs(p.y-curtain)*2.8);
   float threads=pow(.5+.5*sin(p.x*13.0+q.x*4.0+t),5.0);
   col=vec3(.018,.025,.035)+mix(u_colorB,u_colorC,uv.x)*light*(.3+threads*.3+u_energy*.2);
   col+=u_colorA*exp(-abs(p.y+curtain*.65)*5.0)*.2;
 }
 if(u_style>1.5 && u_style<2.5){
   col=vec3(.018,.022,.035)+pigment*(.1+silk*.11);
   vec2 stars=p*8.0+vec2(t*.45,t*.2),cell=floor(stars);
   for(int a=-1;a<=1;a++){for(int b=-1;b<=1;b++){
     vec2 id=cell+vec2(float(a),float(b));float seed=hash(id);
     vec2 point=id+vec2(seed,hash(id+19.0));float d=length(stars-point);
     float sparkle=.45+.55*sin(u_time*.35+seed*24.0);
     col+=mix(u_colorA,u_colorB,seed)*(.01/(d*d+.035))*step(.45,seed)*sparkle*(.11+u_energy*.18);
   }}
 }
 if(u_style>2.5){
   vec2 center=p-vec2(-.48,.04);float angle=atan(center.y,center.x);
   float frequency=texture2D(u_audio,vec2((angle+3.14159)/6.28318,.5)).r;
   float ring=abs(length(center)-(.64+frequency*.12));
   col=vec3(.018,.023,.034)+pigment*(.1+silk*.14);
   col+=mix(u_colorA,u_colorB,.5+.5*sin(angle+u_time*.12))*exp(-ring*60.0)*(.35+u_energy*.35);
   col+=u_colorC*exp(-abs(length(center)-.94)*30.0)*.09;
 }
 // A fine spectrum floats above the transport. Its heights come only from FFT data.
 float x=(uv.x-.09)/.82;
 float index=floor(x*64.0);
 float amplitude=texture2D(u_audio,vec2((index+.5)/64.0,.5)).r;
 float height=amplitude*u_band.y;
 float bar=(1.0-smoothstep(.15,.29,abs(fract(x*64.0)-.5)))*step(.0,x)*step(x,1.0);
 float line=step(u_band.x,uv.y)*(1.0-smoothstep(u_band.x+height,u_band.x+.004+height,uv.y))*bar;
 col+=mix(u_colorA,vec3(.9,.93,.95),.55)*line*u_spectrum*.38;
 col+=(hash(gl_FragCoord.xy)-.5)*.014;
 gl_FragColor=vec4(col,1.0);
}
`

export const defaultPalette = [[.68,.46,.30],[.24,.43,.57],[.42,.35,.54]]

/** Pick separated, mid-tone colors, not the dark frame or white album lettering. */
export function paletteFromPixels(pixels) {
  const buckets = new Map()
  for (let i = 0; i < pixels.length; i += 4) {
    const r=pixels[i]/255,g=pixels[i+1]/255,b=pixels[i+2]/255, hi=Math.max(r,g,b),lo=Math.min(r,g,b)
    if (pixels[i+3]<200 || hi<.18 || lo>.85 || hi-lo<.09) continue
    const key=[r,g,b].map(v=>Math.floor(v*5)).join(',')
    const entry=buckets.get(key)||{count:0,color:[r,g,b]};entry.count++;buckets.set(key,entry)
  }
  const chosen=[]
  for (const entry of [...buckets.values()].sort((a,b)=>b.count-a.count)) {
    if(chosen.every(color=>color.reduce((sum,v,i)=>sum+(v-entry.color[i])**2,0)>.07))chosen.push(entry.color)
    if(chosen.length===3)break
  }
  return chosen.length ? [chosen[0],chosen[1]||chosen[0].map(v=>v*.72),chosen[2]||defaultPalette[2]] : defaultPalette.map(c=>[...c])
}

export function createScene(canvas) {
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power',preserveDrawingBuffer:false})
  if(!gl)return null
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error('Shader compilation failed')}return shader}
  let vertex,fragment,program,buffer,texture
  try {
    vertex=compile(gl.VERTEX_SHADER,vertexShader);fragment=compile(gl.FRAGMENT_SHADER,fragmentShader)
    program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program)
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader link failed')
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
    const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0)
    const uniforms=Object.fromEntries(['resolution','time','energy','spectrum','style','band','colorA','colorB','colorC','audio'].map(key=>[key,gl.getUniformLocation(program,'u_'+key)]))
    texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
    const bytes=new Uint8Array(64)
    return {
      draw(time,energy,levels,palette,spectrum,band=[.17,.04],style=0){
        if(gl.isContextLost())return
        gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program)
        gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.energy,energy);gl.uniform1f(uniforms.spectrum,spectrum)
        gl.uniform1f(uniforms.style,style)
        gl.uniform2f(uniforms.band,band[0],band[1]);gl.uniform3fv(uniforms.colorA,palette[0]);gl.uniform3fv(uniforms.colorB,palette[1]);gl.uniform3fv(uniforms.colorC,palette[2]);gl.uniform1i(uniforms.audio,0)
        for(let i=0;i<64;i++)bytes[i]=Math.round((levels[i]||0)*255)
        gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,64,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,bytes);gl.drawArrays(gl.TRIANGLES,0,6)
      },
      dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment)}
    }
  } catch {
    if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);if(vertex)gl.deleteShader(vertex);if(fragment)gl.deleteShader(fragment)
    return null
  }
}

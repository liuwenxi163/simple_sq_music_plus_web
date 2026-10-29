const rgba=(c,a)=>`rgba(${c.map(v=>Math.round(Math.min(1,v)*255)).join(',')},${a})`
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t)

/** Vector spectra over cached light textures avoid full-screen fragment noise. */
export function createScene(canvas){
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null
  let key='',lights=[],disposed=false
  function colors(palette){
    const next=palette.flat().join(',');if(key===next)return;key=next
    lights=palette.map(color=>{const image=canvas.ownerDocument.createElement('canvas');image.width=image.height=256;const c=image.getContext('2d'),g=c.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,rgba(color,.55));g.addColorStop(.35,rgba(color,.24));g.addColorStop(1,rgba(color,0));c.fillStyle=g;c.fillRect(0,0,256,256);return image})
  }
  function curve(points){ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length-1;i++)ctx.quadraticCurveTo(...points[i],(points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2);ctx.lineTo(...points.at(-1))}
  function draw(s,palette,mode,l){
    if(disposed||!l.width||!l.height)return;colors(palette)
    const {width:w,height:h,cover,rail}=l,{levels,peaks,waveform,bass,mids,highs,beat,energy,live}=s,cx=cover.x+cover.width/2,cy=cover.y+cover.height/2
    ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgb(12,17,27)';ctx.fillRect(0,0,w,h)
    const glow=(i,x,y,r,a)=>{ctx.globalAlpha=Math.min(1,a);ctx.drawImage(lights[i],x-r,y-r,r*2,r*2)}
    glow(0,cx-w*.05,cy,Math.max(w*.46,h*.68)*(1+bass*.1),.45+bass*.45+beat*.15);glow(1,w*.85,h*.25,Math.max(w*.4,h*.6)*(1+mids*.12),.4+mids*.25);glow(2,w*.62,h*.82,Math.max(w*.36,h*.48),.25+highs*.25);ctx.globalAlpha=1
    if(mode==='still')return
    const light=live?1:0,base=h*.64,spread=Math.min(h*.18,160);ctx.lineJoin=ctx.lineCap='round'
    // Every moving contour is a shape of current FFT data, without timed fake heights.
    if(mode==='aurora')for(let layer=0;layer<3;layer++){
      const points=Array.from(levels,(v,i)=>{const t=i/(levels.length-1);return[w*(.015+.97*t),base+(layer-1)*24-Math.sin(t*Math.PI)*spread*.4-v*spread*(.6+layer*.25)+waveform[i*2]*spread*.25]})
      curve(points);ctx.strokeStyle=rgba(palette[layer],(.035+energy*.035)*light);ctx.lineWidth=28;ctx.stroke();curve(points);ctx.strokeStyle=rgba(palette[layer],(.18+energy*.2)*light);ctx.lineWidth=1.2;ctx.stroke()
    }
    if(mode==='spectrum')for(let i=0;i<64;i++){
      const value=levels[i],step=w*.94/64,x=w*.03+(i+.5)*step,height=value*h*.24,color=mix(palette[0],palette[1],i/63)
      ctx.fillStyle=rgba(color,(.04+value*.16)*light);ctx.fillRect(x-step*.18,base-height,step*.36,height)
      ctx.fillStyle=rgba(color,.34*light);ctx.fillRect(x-step*.18,base-peaks[i]*h*.24-3,step*.36,1)
    }
    if(mode==='curtain')for(let i=0;i<32;i++){
      const v=levels[i*2],x=w*(.035+.93*i/31),height=h*(.14+v*.5);ctx.globalAlpha=(.045+v*.2)*light;ctx.drawImage(lights[i%3],x-w*.035,h*.7-height,w*.07,height*1.5);ctx.globalAlpha=1;ctx.strokeStyle=rgba(palette[i%3],v*.32*light);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,h*.7);ctx.lineTo(x,h*.7-height*.72);ctx.stroke()
    }
    if(mode==='stars')for(let i=0;i<96;i++){
      const v=levels[i%64],x=((i*.61803398875)%1)*w,y=((i*.38196601125+i*i*.007)%1)*h*.8;ctx.fillStyle=rgba(palette[i%3],(.08+v*.64)*light);ctx.beginPath();ctx.arc(x,y,.5+v*2.5,0,Math.PI*2);ctx.fill()
      if(v>.7){ctx.strokeStyle=rgba(palette[i%3],(v-.7)*.6);ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.stroke()}
    }
    if(mode==='orbit'){
      const radius=Math.min(cover.width*.74,w*.44),points=[]
      for(let i=0;i<=128;i++){const t=i/128,a=t*Math.PI*2-Math.PI/2,v=levels[Math.min(63,Math.floor(t*64))],r=radius+v*Math.min(50,w*.08);points.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}
      curve(points);ctx.strokeStyle=rgba(palette[0],.09*light);ctx.lineWidth=16;ctx.stroke();curve(points);ctx.strokeStyle=rgba(mix(palette[0],palette[1],.35),.65*light);ctx.lineWidth=1.4;ctx.stroke()
      for(let ring=0;ring<3;ring++){const v=[bass,mids,highs][ring];ctx.strokeStyle=rgba(palette[ring],(.045+v*.12)*light);ctx.lineWidth=.7;ctx.beginPath();ctx.arc(cx,cy,radius+12+ring*14+v*20,0,Math.PI*2);ctx.stroke()}
    }
    const step=rail.width/64,maxHeight=Math.max(8,rail.height-10),baseline=rail.y+rail.height-4
    ctx.strokeStyle=rgba(palette[0],.1);ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(rail.x,baseline);ctx.lineTo(rail.x+rail.width,baseline);ctx.stroke()
    for(let i=0;i<64;i++){
      const v=levels[i],height=Math.max(1,v*maxHeight),x=rail.x+(i+.5)*step,color=mix(palette[0],palette[1],i/63);ctx.strokeStyle=rgba(color,light*(.34+v*.45));ctx.lineWidth=Math.max(1.2,Math.min(3.4,step*.32));ctx.beginPath();ctx.moveTo(x,baseline);ctx.lineTo(x,baseline-height);ctx.stroke()
      if(live&&peaks[i]>.035){ctx.fillStyle=rgba(mix(color,[.9,.94,.98],.5),.65);ctx.fillRect(x-1,baseline-peaks[i]*maxHeight-3,2,1.2)}
    }
  }
  return{draw,dispose(){disposed=true;lights=[]}}
}

import {scenePalette,createSceneClock,spectrumBars,starField,orbitShape} from './scene-model'
import {drawAtelier} from './scene-ateliers'
const rgba=(c,a)=>`rgba(${c.map(v=>Math.round(Math.min(1,v)*255)).join(',')},${a})`
export function createScene(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return null
 let disposed=false,key='',lights=[];const clock=createSceneClock()
 function textures(p){const stamp=p.flat().join(',');if(key===stamp)return;key=stamp;lights=p.map(c=>{const image=canvas.ownerDocument.createElement('canvas');image.width=image.height=192;const t=image.getContext('2d'),g=t.createRadialGradient(96,96,0,96,96,96);g.addColorStop(0,rgba(c,.8));g.addColorStop(.4,rgba(c,.28));g.addColorStop(1,rgba(c,0));t.fillStyle=g;t.fillRect(0,0,192,192);return image})}
 return {draw(s,album,mode,l,{now=performance.now(),gpu=false}={}){
  if(disposed||!l.width||!l.height)return
  const {width:w,height:h,cover}=l,p=scenePalette(mode,album),e=s.live?s.energy:0,b=s.live?s.bass:0,phase=clock.step(now,!!s.live&&mode!=='still',mode,mode==='stars'?.4+e*1.5+b*.6:1)
  textures(p);ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h)
  if(drawAtelier(ctx,s,mode,l,phase))return {rotation:phase*.3}
  const glow=(i,x,y,r,a)=>{ctx.globalAlpha=a;ctx.drawImage(lights[i],x-r,y-r,r*2,r*2);ctx.globalAlpha=1}
  if(mode==='aurora'){
   if(!gpu){ctx.fillStyle='rgb(12,20,31)';ctx.fillRect(0,0,w,h);for(let i=0;i<3;i++)glow(i,w*(.25+.27*i)+Math.sin(phase*.22+i)*w*.17,h*(.3+.18*i)+Math.cos(phase*.17+i)*h*.2,Math.max(w,h)*(.5+e*.12),.55+e*.2)}
   return
  }
  if(mode==='still')return
  if(mode==='spectrum'){
   ctx.fillStyle='rgb(9,19,28)';ctx.fillRect(0,0,w,h)
   const bars=spectrumBars(s,l),base=bars[0].base,maxHeight=bars[0].maxHeight,grad=ctx.createLinearGradient(0,base-maxHeight,0,base);grad.addColorStop(0,rgba(p[2],.94));grad.addColorStop(.5,rgba(p[0],.8));grad.addColorStop(1,rgba(p[1],.32))
   ctx.strokeStyle=rgba(p[0],.075);ctx.lineWidth=1;for(let row=0;row<5;row++){const y=base-row*maxHeight/4;ctx.beginPath();ctx.moveTo(w*.055,y);ctx.lineTo(w*.945,y);ctx.stroke()}
   for(const bar of bars){if(bar.height<.4)continue;ctx.fillStyle=grad;ctx.globalAlpha=.48+bar.value*.5;ctx.fillRect(bar.x-bar.width/2,base-bar.height,bar.width,bar.height);ctx.fillStyle=rgba(p[2],.85);ctx.fillRect(bar.x-bar.width/2,base-bar.peak-4,bar.width,1.5);ctx.fillStyle=rgba(p[0],.14);ctx.fillRect(bar.x-bar.width/2,base+5,bar.width,bar.height*.14)}ctx.globalAlpha=1
   return
  }
  if(mode==='curtain'){
   if(!gpu){ctx.fillStyle='rgb(8,23,25)';ctx.fillRect(0,0,w,h);glow(0,w*.2,h*.2,w*.65,.5);glow(2,w*.75,h*.4,w*.55,.25)}
   const bottom=h*.91,top=h*.015;ctx.lineCap='round'
   for(let i=0;i<28;i++){const v=s.live?s.levels[i*2%64]:0,x=w*(.025+.79*i/27),bend=Math.sin(i*.62+phase*.18)*w*(.018+b*.035),color=p[i%3],g=ctx.createLinearGradient(0,top,0,bottom);g.addColorStop(0,rgba(color,.06));g.addColorStop(.26,rgba(color,.18+v*.48));g.addColorStop(.66,rgba(color,.04+v*.24));g.addColorStop(1,rgba(color,0));ctx.strokeStyle=g;ctx.lineWidth=w/28*(.22+v*.38);ctx.beginPath();ctx.moveTo(x,bottom);ctx.bezierCurveTo(x+bend*2,h*.63,x-bend,h*.32,x+bend*.5,top);ctx.stroke();ctx.lineWidth=1;ctx.stroke()}
   return
  }
  if(mode==='stars'){
   ctx.fillStyle='rgb(10,12,29)';ctx.fillRect(0,0,w,h);glow(1,w*.28,h*.4,Math.max(w,h)*.55,.08+e*.1);glow(0,w*.85,h*.72,w*.5,.11)
   const stars=starField(s,l,phase);for(let i=0;i<stars.length;i++){const t=stars[i];if(t.x<0||t.x>w||t.y<0||t.y>h)continue;ctx.strokeStyle=rgba(p[i%3],t.alpha*.8);ctx.lineWidth=Math.max(.5,t.r*.6);ctx.beginPath();ctx.moveTo(t.tx,t.ty);ctx.lineTo(t.x,t.y);ctx.stroke();ctx.fillStyle=rgba(p[2],t.alpha);ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.fill()}
   return
  }
  if(mode==='orbit'){
   ctx.fillStyle='rgb(12,15,25)';ctx.fillRect(0,0,w,h);const ring=orbitShape(s,l,phase);glow(0,ring.cx,ring.cy,ring.r*1.6,.14+e*.2)
   ctx.lineWidth=1;ctx.strokeStyle=rgba(p[0],.16);ctx.beginPath();ctx.ellipse(ring.cx,ring.cy,ring.r+42+b*9,ring.ry+14+b*3,0,0,Math.PI*2);ctx.stroke()
   for(let i=0;i<96;i++){const a=i/96*Math.PI*2-phase*.035,v=s.live?s.levels[Math.floor(i*64/96)]:0,x=ring.cx+Math.cos(a)*(ring.r+9),y=ring.cy+Math.sin(a)*(ring.ry+4);ctx.strokeStyle=rgba(p[i%3],.2+v*.6);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*(2+v*28),y+Math.sin(a)*(2+v*12));ctx.stroke()}
   ctx.beginPath();ring.points.forEach((t,i)=>i?ctx.lineTo(t.x,t.y):ctx.moveTo(t.x,t.y));ctx.closePath();ctx.strokeStyle=rgba(p[0],.5+e*.35);ctx.lineWidth=1.9;ctx.stroke();ctx.strokeStyle=rgba(p[0],.06+b*.08);ctx.lineWidth=10;ctx.stroke()
  }
 },dispose(){disposed=true;lights=[]}}
}

const clamp=v=>Math.max(0,Math.min(1,Number(v)||0))
const band=(s,i)=>s.live?clamp(s.levels?.[i]):0
export const sceneKinds={aurora:'liquid',spectrum:'equalizer',curtain:'light-curtain',stars:'star-flight',orbit:'radial-wave',still:'artwork'}
export function scenePalette(mode,album){if(mode==='orbit')return album.map(c=>{const peak=Math.max(.1,...c);return c.map(v=>.2+v/peak*.7)});return ({spectrum:[[.3,.8,.9],[.56,.87,.92],[.86,.94,.98]],curtain:[[.17,.82,.55],[.2,.65,.76],[.61,.39,.84]],stars:[[.42,.54,.87],[.74,.52,.9],[.83,.9,.98]]})[mode]||album}
export function createSceneClock(){let phase=0,last=null,kind;return {step(now,active,mode,rate=1){if(kind!==mode){last=null;kind=mode}if(active&&last!==null)phase+=Math.max(0,Math.min(1,(now-last)/1000))*Math.max(0,Math.min(3,rate));last=active?now:null;return phase}}}
export function spectrumBars(s,l){
 const x=l.width*.055,width=l.width*.89,base=l.rail?.height?l.rail.y+l.rail.height-5:Math.min((l.dockY||l.height*.83)-12,l.height*.81),available=base-(l.recordBottom||0)-15,height=Math.min(l.height*.19,158,available>=24?available:Math.max(12,(l.rail?.height||24)-6)),step=width/64
 return Array.from({length:64},(_,i)=>({x:x+(i+.5)*step,width:Math.max(1.5,step*.57),base,maxHeight:height,height:band(s,i)*height,peak:s.live?clamp(s.peaks?.[i])*height:0,value:band(s,i)}))
}
export function orbitShape(s,l,phase=0){
 const c=l.cover,cx=c.x+c.width/2,cy=c.y+c.height/2,r=c.width*.72,ry=c.height*.5+10
 return {cx,cy,r,ry,points:Array.from({length:129},(_,i)=>{const t=i%128,a=t/128*Math.PI*2+phase*.035,v=band(s,Math.floor(t/2)),wave=s.live?Math.max(-1,Math.min(1,Number(s.waveform?.[t])||0)):0,rr=r+Math.sqrt(v)*Math.min(34,c.width*.1)+wave*12,vertical=ry+Math.sqrt(v)*10+wave*4;return {x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*vertical,value:v}})}
}
export function starField(s,l,phase=0){
 const count=l.width<760?180:420,cx=l.width*.44,cy=l.height*.42,focal=Math.max(l.width,l.height)*.62
 return Array.from({length:count},(_,i)=>{const sx=((i*.754877666)%1-.5)*2.8,sy=((i*.569840291)%1-.5)*2.2,z=.16+((i*.618033989-phase*.055)%1+1)%1*1.5,v=band(s,i%64),project=depth=>({x:cx+sx*focal/depth,y:cy+sy*focal/depth}),point=project(z),tail=project(z+.04+(s.live?clamp(s.bass)*.06:0));return {...point,tx:tail.x,ty:tail.y,r:Math.min(4.2,1.2/z),alpha:Math.min(1,(.42+v*.65)/z),value:v}})
}

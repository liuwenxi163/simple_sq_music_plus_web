const rgba=(c,a)=>`rgba(${c.map(v=>Math.round(Math.min(1,v)*255)).join(',')},${a})`
export function createScene(canvas){
  const ctx=canvas.getContext('2d');if(!ctx)return null
  let disposed=false
  return {draw(s,palette,mode,l){
    if(disposed||!l.width||!l.height)return
    const {width:w,height:h,cover,rail}=l;ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.clearRect(0,0,w,h)
    if(!s.live||mode==='still')return
    if(mode==='spectrum'){
      const step=rail.width/64,base=rail.y+rail.height-3
      ctx.lineCap='round';ctx.lineWidth=Math.min(2.4,step*.28)
      for(let i=0;i<64;i++){const v=s.levels[i];if(v<.008)continue;ctx.strokeStyle=rgba(palette[i%3],.3+v*.5);ctx.beginPath();ctx.moveTo(rail.x+(i+.5)*step,base);ctx.lineTo(rail.x+(i+.5)*step,base-v*(rail.height-5));ctx.stroke()}
    }
    if(mode==='stars')for(let i=0;i<48;i++){const v=s.levels[i];ctx.fillStyle=rgba(palette[i%3],v*.65);ctx.beginPath();ctx.arc(((i*.618034)%1)*w,((i*.381966)%1)*h,.5+v,0,Math.PI*2);ctx.fill()}
    if(mode==='orbit'){
      const cx=cover.x+cover.width/2,cy=cover.y+cover.height/2
      ctx.strokeStyle=rgba(palette[0],.38+s.energy*.45);ctx.lineWidth=1.8;ctx.beginPath()
      for(let i=0;i<=128;i++){const a=i/128*Math.PI*2,r=cover.width*.74+Math.sqrt(s.levels[Math.floor(i/2)%64])*34,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.stroke();ctx.strokeStyle=rgba(palette[0],.05+s.bass*.08);ctx.lineWidth=9;ctx.stroke()
    }
  },dispose(){disposed=true}}
}

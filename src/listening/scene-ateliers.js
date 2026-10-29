import {tunnelFrames, terrainContours, prismFacets, waterLines, inkStrokes} from './scene-recipes'

const path = (ctx, points) => {
  ctx.beginPath()
  points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))
}
const fill = (ctx, color, w, h) => {ctx.fillStyle = color; ctx.fillRect(0, 0, w, h)}
function haze(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(20,25,38,0)')
  ctx.fillStyle = g; ctx.fillRect(x-r, y-r, r*2, r*2)
}

/** One drawing call from the existing player loop; no independent timers or audio graphs. */
export function drawAtelier(ctx, s, mode, l, phase) {
  const {width:w, height:h, cover:c} = l, e = s.live ? s.energy : 0, bass = s.live ? s.bass : 0
  if (mode === 'vinyl') {
    fill(ctx, 'rgb(26,22,29)', w, h)
    haze(ctx, c.x+c.width*.5, c.y+c.height*.6, Math.max(w,h)*.65, `rgba(148,88,69,${.19+e*.12})`)
    ctx.strokeStyle = 'rgba(220,185,146,.04)'; ctx.lineWidth = 1
    for(let i=0;i<20;i++){ctx.beginPath();ctx.moveTo(0,h*.2+i*27);ctx.lineTo(w,h*.05+i*27);ctx.stroke()}
    return true
  }
  if (mode === 'neon') {
    fill(ctx, 'rgb(18,9,36)', w, h)
    haze(ctx, w*.33, h*.45, w*.65, `rgba(99,32,151,${.28+e*.15})`)
    for (const [i, f] of tunnelFrames(s,l,phase).entries()) {
      ctx.strokeStyle = i%2 ? `rgba(247,91,192,${f.alpha})` : `rgba(95,178,245,${f.alpha*.8})`
      ctx.lineWidth = 1 + f.value*1.8
      const x=f.cx-f.rx,y=f.cy-f.ry,cut=Math.min(f.rx,f.ry)*.28
      path(ctx,[{x:x+cut,y},{x:x+f.rx*2-cut,y},{x:x+f.rx*2,y:y+cut},{x:x+f.rx*2,y:y+f.ry*2-cut},{x:x+f.rx*2-cut,y:y+f.ry*2},{x:x+cut,y:y+f.ry*2},{x,y:y+f.ry*2-cut},{x,y:y+cut}]);ctx.closePath();ctx.stroke()
    }
    const horizon=h*.62
    ctx.strokeStyle='rgba(170,108,235,.18)';ctx.lineWidth=1
    for(let i=-8;i<=12;i++){ctx.beginPath();ctx.moveTo(w*.4,horizon);ctx.lineTo(w*.4+i*w*.17,h);ctx.stroke()}
    for(let i=0;i<9;i++){const t=((i/9+phase*.045)%1+1)%1,y=horizon+(h-horizon)*t*t;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    return true
  }
  if (mode === 'terrain') {
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'rgb(27,30,63)');sky.addColorStop(.53,'rgb(111,69,91)');sky.addColorStop(1,'rgb(24,25,45)');fill(ctx,sky,w,h)
    const sunX=w*.32,sunY=h*.37,r=Math.min(w,h)*(.14+bass*.014)
    haze(ctx,sunX,sunY,r*2,'rgba(248,173,131,.17)');ctx.fillStyle='rgba(243,185,150,.42)';ctx.beginPath();ctx.arc(sunX,sunY,r,0,Math.PI*2);ctx.fill()
    const colors=['#797086','#776378','#70566b','#63465e','#50384f','#392b42','#262337']
    for(const [i,row] of terrainContours(s,l,phase).entries()){
      path(ctx,row.points);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fillStyle=colors[i];ctx.fill()
      path(ctx,row.points);ctx.strokeStyle=`rgba(245,179,160,${.08+row.depth*.2})`;ctx.lineWidth=1.2;ctx.stroke()
    }
    return true
  }
  if (mode === 'prism') {
    fill(ctx,'rgb(27,15,39)',w,h);haze(ctx,c.x+c.width*.5,c.y+c.height*.5,w*.5,`rgba(167,63,109,${.17+e*.2})`)
    const colors=[[244,139,149],[173,139,227],[108,184,211],[242,187,139]]
    for(const [i,facet] of prismFacets(s,l,phase).entries()){
      const color=colors[i%4],a=facet.points[0],b=facet.points[2],g=ctx.createLinearGradient(a.x,a.y,b.x,b.y)
      g.addColorStop(0,`rgba(${color},.03)`);g.addColorStop(.58,`rgba(${color},${.2+facet.value*.45})`);g.addColorStop(1,`rgba(${color},.04)`)
      path(ctx,facet.points);ctx.closePath();ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=`rgba(${color},${.16+facet.value*.3})`;ctx.lineWidth=.7;ctx.stroke()
    }
    return true
  }
  if (mode === 'water') {
    const sea=ctx.createLinearGradient(0,0,w,h);sea.addColorStop(0,'rgb(16,72,80)');sea.addColorStop(.52,'rgb(12,41,58)');sea.addColorStop(1,'rgb(10,23,39)');fill(ctx,sea,w,h)
    haze(ctx,w*.18,h*.2,w*.7,`rgba(100,209,189,${.16+e*.13})`)
    for(const [i,points] of waterLines(s,l,phase).entries()){
      path(ctx,points);ctx.strokeStyle=`rgba(132,227,213,${.13+(i%3)*.025+e*.07})`;ctx.lineWidth=i%3===0?2.8:.85;ctx.stroke()
      ctx.save();ctx.translate(-w*.05,h*.06);ctx.scale(1,-.72);ctx.translate(0,-h);path(ctx,points);ctx.strokeStyle='rgba(138,215,237,.09)';ctx.lineWidth=1.4;ctx.stroke();ctx.restore()
    }
    return true
  }
  if (mode === 'ink') {
    fill(ctx,'rgb(232,232,223)',w,h)
    // Deterministic paper fibres, not a random audio visualization.
    ctx.fillStyle='rgba(66,78,78,.035)'
    for(let i=0;i<260;i++){const x=((i*.754877666)%1)*w,y=((i*.569840291)%1)*h;ctx.fillRect(x,y,1.5,1)}
    for(const [i,points] of inkStrokes(s,l).entries()){
      path(ctx,points);ctx.strokeStyle=`rgba(37,57,62,${.045+i*.015})`;ctx.lineWidth=3+i*1.9;ctx.lineCap='round';ctx.stroke()
    }
    return true
  }
  return false
}

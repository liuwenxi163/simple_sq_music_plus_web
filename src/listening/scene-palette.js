export const defaultPalette = [[.34,.68,.77],[.42,.44,.72],[.69,.45,.64]]

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


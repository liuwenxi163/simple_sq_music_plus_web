const unit = v => Math.max(0, Math.min(1, Number(v) || 0))
const band = (s, i) => s.live ? unit(s.levels?.[i % 64]) : 0
const wave = (s, i) => s.live ? Math.max(-1, Math.min(1, Number(s.waveform?.[i % 128]) || 0)) : 0
const energy = s => s.live ? unit(s.energy) : 0

// These are visual materials, not historical charts. Only the live input deforms them.
export function tunnelFrames(s, l, phase) {
  const cx = l.cover.x + l.cover.width / 2, cy = l.cover.y + l.cover.height * .48
  return Array.from({length: 11}, (_, i) => {
    const depth = ((i / 11 + phase * .035) % 1 + 1) % 1
    const scale = .13 + depth ** 2 * 2.3, v = band(s, i * 5)
    return {cx, cy, rx: l.width * .6 * scale, ry: l.height * .65 * scale, alpha: .08 + depth * .44 + v * .3, value: v}
  })
}

export function terrainContours(s, l, phase) {
  return Array.from({length: 7}, (_, row) => ({
    depth: row / 6,
    points: Array.from({length: 97}, (_, i) => {
      const t = i / 96, v = band(s, Math.floor(t * 63)), hill = Math.sin(t * 6.4 + row * .85 + phase * .04) * .55 + Math.sin(t * 13 - row * .6) * .25
      return {x: t * l.width, y: l.height * (.5 + row * .052) - (hill + .4) * l.height * (.055 + row * .009) - v * l.height * (.018 + row * .009)}
    })
  }))
}

export function prismFacets(s, l, phase) {
  const c = l.cover, cx = c.x + c.width / 2, cy = c.y + c.height / 2
  const point = (a, radius) => ({x: cx + Math.cos(a) * c.width * radius, y: cy + Math.sin(a) * c.height * radius * .63})
  return Array.from({length: 24}, (_, i) => {
    const a = i / 24 * Math.PI * 2 + phase * .018, v = band(s, Math.floor(i * 64 / 24))
    return {value: v, points: [point(a - .14, .58), point(a + .01, .91 + v * .16), point(a + .16, .65), point(a + .24, .39)]}
  })
}

export function waterLines(s, l, phase) {
  const count = l.width < 760 ? 18 : 30, e = energy(s)
  return Array.from({length: count}, (_, row) => Array.from({length: 81}, (_, i) => {
    const x = i / 80 * l.width, t = x / l.width * 9, v = band(s, (i + row) % 64)
    return {x, y: row / (count - 1) * l.height + Math.sin(t + row * .8 + phase * .23) * (13 + e * 24) + Math.sin(t * 1.7 - row * .5 - phase * .13) * (8 + v * 13)}
  }))
}

export function inkStrokes(s, l) {
  return Array.from({length: 6}, (_, row) => Array.from({length: 129}, (_, i) => {
    const t = i / 128, shape = Math.sin(t * 5.4 + row * .22) * .4 + Math.cos(t * 12.5 - row * .25) * .13
    return {x: t * l.width, y: l.height * (.7 + row * .019) - shape * l.height * .18 - wave(s, i) * l.height * .095 - band(s, Math.floor(t * 63)) * l.height * .04}
  }))
}

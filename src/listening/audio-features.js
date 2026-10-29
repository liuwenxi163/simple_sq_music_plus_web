const clamp = value => Math.max(0, Math.min(1, value))
const follow = (previous, target, dt, attack = .018, release = .14) => previous + (target - previous) * (1 - Math.exp(-dt / (target > previous ? attack : release)))

/** Log-spaced FFT bands and time-domain loudness. Silence always maps to zero. */
export function createAudioFeatures({ sampleRate = 48000, fftSize = 4096, count = 64 } = {}) {
  const levels = new Float32Array(count), peaks = new Float32Array(count), waveform = new Float32Array(128)
  const centres = Array.from({ length: count }, (_, i) => 32 * Math.pow(Math.min(16000, sampleRate / 2) / 32, (i + .5) / count))
  let energy = 0, bass = 0, mids = 0, highs = 0, beat = 0, floor = 0, last = 0
  const frame = { levels, peaks, waveform, energy: 0, bass: 0, mids: 0, highs: 0, beat: 0 }
  function reset() {
    levels.fill(0); peaks.fill(0); waveform.fill(0)
    energy = bass = mids = highs = beat = floor = last = 0
    Object.assign(frame, { energy, bass, mids, highs, beat }); return frame
  }
  function sample(bins, samples, now) {
    const dt = last ? Math.max(.001, Math.min(.1, (now - last) / 1000)) : 1 / 60
    last = now
    let low = 0, middle = 0, high = 0, lows = 0, middles = 0, highsCount = 0
    for (let i = 0; i < count; i++) {
      const from = Math.max(1, Math.floor(centres[i] / Math.pow(16000 / 32, .5 / count) * fftSize / sampleRate))
      const to = Math.min(bins.length, Math.max(from + 1, Math.ceil(centres[i] * Math.pow(16000 / 32, .5 / count) * fftSize / sampleRate)))
      let sum = 0
      for (let n = from; n < to; n++) sum += (bins[n] / 255) ** 2
      const value = Math.pow(clamp((Math.sqrt(sum / Math.max(1, to - from)) - .06) / .86), 1.15)
      levels[i] = follow(levels[i], value, dt)
      peaks[i] = Math.max(levels[i], peaks[i] - dt * .65)
      if (centres[i] < 180) { low += value; lows++ }
      else if (centres[i] >= 250 && centres[i] < 2400) { middle += value; middles++ }
      else if (centres[i] >= 4000 && centres[i] < 14000) { high += value; highsCount++ }
    }
    let square = 0, mean = 0
    for (const value of samples) mean += value
    mean /= Math.max(1, samples.length)
    for (const value of samples) square += (value - mean) ** 2
    const rms = Math.sqrt(square / Math.max(1, samples.length))
    energy = follow(energy, clamp(rms * 3.4), dt, .012, .12)
    bass = follow(bass, low / Math.max(1, lows), dt)
    mids = follow(mids, middle / Math.max(1, middles), dt)
    highs = follow(highs, high / Math.max(1, highsCount), dt, .012, .09)
    floor = follow(floor, bass, dt, 1.2, 1.2)
    beat = follow(beat, clamp((bass - floor - .06) * 2.8), dt, .008, .12)
    for (let i = 0; i < waveform.length; i++) {
      const start = Math.floor(i * samples.length / waveform.length), end = Math.max(start + 1, Math.floor((i + 1) * samples.length / waveform.length))
      let value = 0
      for (let n = start; n < end && n < samples.length; n++) value += samples[n] - mean
      waveform[i] = follow(waveform[i], value / (end - start), dt, .012, .05)
    }
    Object.assign(frame, { energy, bass, mids, highs, beat }); return frame
  }
  return { sample, reset }
}

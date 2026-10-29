import { startPlayback } from './playback.js'

/** Keep the original three-open retry budget, including a non-CORS fallback.
 * Analysis captures a copy of playback and never reroutes the audible element. */
export async function startVisualPlayback(audio, url, options = {}) {
  audio.crossOrigin = 'anonymous'
  try { await startPlayback(audio, url, { ...options, maxAttempts: 1 }) }
  catch (error) {
    if (options.isCurrent?.() === false || ['AbortError', 'NotAllowedError'].includes(error.name) || audio.error?.code === 3) throw error
    if (!['NotSupportedError', 'NetworkError', 'TimeoutError'].includes(error.name) && ![2, 4].includes(audio.error?.code)) throw error
    audio.removeAttribute('crossorigin')
    await startPlayback(audio, url, { ...options, maxAttempts: 2 })
  }
}

export function createAudioAnalysis(audio, { Context = globalThis.AudioContext || globalThis.webkitAudioContext } = {}) {
  let context, source, analyser, muted, stream, bins, disposed = false
  const levels = new Float32Array(64)
  function attach() {
    if (!context || disposed) return
    try {
      source?.disconnect()
      const capture = audio.captureStream || audio.mozCaptureStream
      if (!capture) return
      stream = capture.call(audio)
      if (!stream.getAudioTracks().length) { source = null; return }
      source = context.createMediaStreamSource(stream)
      source.connect(analyser)
    } catch { source = null }
  }
  async function activate() {
    if (disposed || !Context) return false
    try {
      if (!context) {
        context = new Context()
        analyser = context.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = .8
        bins = new Uint8Array(analyser.frequencyBinCount)
        // A silent sink keeps the capture graph running without duplicating sound.
        muted = context.createGain(); muted.gain.value = 0
        analyser.connect(muted); muted.connect(context.destination)
        audio.addEventListener('playing', attach)
      }
      await context.resume(); attach(); return context.state === 'running'
    } catch { return false }
  }
  function sample() {
    if (!source || !analyser || context?.state !== 'running' || audio.paused) { levels.fill(0); return { levels, energy: 0, live: false } }
    try {
      analyser.getByteFrequencyData(bins)
      let energy = 0
      for (let i = 0; i < levels.length; i++) {
        const from = Math.floor(Math.pow(i / levels.length, 2) * (bins.length - 1))
        const to = Math.max(from + 1, Math.floor(Math.pow((i + 1) / levels.length, 2) * bins.length))
        let total = 0; for (let n = from; n < to; n++) total += bins[n]
        const value = total / (to - from) / 255
        levels[i] = levels[i] * .55 + value * .45; energy += value
      }
      return { levels, energy: energy / levels.length, live: energy > .04 }
    } catch { levels.fill(0); return { levels, energy: 0, live: false } }
  }
  function suspend() { context?.suspend().catch(() => {}) }
  function dispose() {
    disposed = true; audio.removeEventListener('playing', attach)
    source?.disconnect(); analyser?.disconnect(); muted?.disconnect(); context?.close().catch(() => {})
    // Never stop the media element or its original audio tracks.
  }
  return { activate, sample, suspend, dispose }
}

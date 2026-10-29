import { startPlayback } from './playback.js'
import { createAudioFeatures } from './audio-features.js'

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

export function createAudioAnalysis(audio, { Context = globalThis.AudioContext || globalThis.webkitAudioContext, now = () => performance.now() } = {}) {
  let context, source, analyser, muted, stream, bins, samples, linkedTrack, disposed = false, wanted = false, captureFailed = false, features = createAudioFeatures()
  const events = ['playing', 'loadedmetadata'], resets = ['emptied', 'seeking', 'pause', 'waiting']
  function reset() { features.reset() }
  function attach() {
    if (!context || disposed) return
    try {
      const capture = audio.captureStream || audio.mozCaptureStream
      if (!capture) return
      if (!stream) { stream = capture.call(audio); stream.addEventListener?.('addtrack', attach); stream.addEventListener?.('removetrack', attach) }
      const track = stream.getAudioTracks().find(track => track.readyState !== 'ended')
      if (source && track === linkedTrack) return
      source?.disconnect(); source = null; linkedTrack = track; reset()
      if (!track) return
      source = context.createMediaStreamSource(stream)
      source.connect(analyser)
      captureFailed = false
    } catch { captureFailed = true; source?.disconnect(); source = null; linkedTrack = null; reset() }
  }
  async function activate() {
    if (disposed || !Context) return false
    wanted = true
    try {
      if (!context) {
        context = new Context()
        analyser = context.createAnalyser(); analyser.fftSize = 4096; analyser.smoothingTimeConstant = .12
        analyser.minDecibels = -90; analyser.maxDecibels = -18
        bins = new Uint8Array(analyser.frequencyBinCount); samples = new Float32Array(analyser.fftSize)
        features = createAudioFeatures({ sampleRate: context.sampleRate || 48000, fftSize: analyser.fftSize })
        // A silent sink keeps the capture graph running without duplicating sound.
        muted = context.createGain(); muted.gain.value = 0
        analyser.connect(muted); muted.connect(context.destination)
        events.forEach(name => audio.addEventListener(name, attach)); resets.forEach(name => audio.addEventListener(name, reset))
      }
      await context.resume()
      if (disposed || !wanted) return false
      attach(); return context.state === 'running'
    } catch { return false }
  }
  function sample() {
    const unsupported = !Context || !(audio.captureStream || audio.mozCaptureStream)
    const unavailable = unsupported || captureFailed || (linkedTrack?.muted === true && audio.readyState >= 3)
    const silent = reason => ({ ...features.reset(), live: false, reason })
    if (unavailable) return silent('unavailable')
    if (!source || !analyser || context?.state !== 'running') return silent('waiting')
    if (audio.paused || audio.seeking || audio.ended || audio.readyState < 3) return silent('paused')
    try {
      analyser.getByteFrequencyData(bins)
      if (analyser.getFloatTimeDomainData) analyser.getFloatTimeDomainData(samples)
      else samples.fill(0)
      return { ...features.sample(bins, samples, now()), live: true, reason: 'live' }
    } catch { return silent('unavailable') }
  }
  function suspend() { wanted = false; reset(); context?.suspend().catch(() => {}) }
  function dispose() {
    disposed = true; wanted = false; events.forEach(name => audio.removeEventListener(name, attach)); resets.forEach(name => audio.removeEventListener(name, reset))
    stream?.removeEventListener?.('addtrack', attach); stream?.removeEventListener?.('removetrack', attach)
    source?.disconnect(); analyser?.disconnect(); muted?.disconnect(); context?.close().catch(() => {})
    // Never stop the media element or its original audio tracks.
  }
  return { activate, sample, suspend, dispose }
}

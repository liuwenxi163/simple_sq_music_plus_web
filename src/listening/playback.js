const waitFor = ms => new Promise(resolve => setTimeout(resolve, ms))

function canceled() { const error = new Error('Playback superseded'); error.name = 'AbortError'; return error }

/** Retry opening the same resource; a failed CDN response can surface as NotSupportedError. */
export async function startPlayback(audio, url, {
  isCurrent = () => true,
  wait = waitFor,
  timeoutMs = 12000,
  maxAttempts = 3
} = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (!isCurrent()) throw canceled()
    if (attempt) await wait(attempt === 1 ? 400 : 1200)
    if (!isCurrent()) throw canceled()
    if (attempt) audio.pause()
    audio.src = url
    audio.load()
    let timer
    try {
      await Promise.race([
        Promise.resolve().then(() => audio.play()),
        new Promise((_, reject) => { timer = setTimeout(() => {
          if (isCurrent()) audio.pause()
          const error = new Error('音频连接超时，请重试'); error.name = 'TimeoutError'; reject(error)
        }, timeoutMs) })
      ])
      if (!isCurrent()) throw canceled()
      return
    } catch (error) {
      if (!isCurrent()) throw canceled()
      if (attempt + 1 >= maxAttempts || error.name === 'NotAllowedError' || error.name === 'AbortError' || audio.error?.code === 3) throw error
      if (!['NotSupportedError', 'NetworkError', 'TimeoutError'].includes(error.name) && ![2, 4].includes(audio.error?.code)) throw error
    } finally { clearTimeout(timer) }
  }
}

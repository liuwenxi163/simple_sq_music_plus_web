// Playback favors browser-compatible MP3. Downloads defer to the server's saved
// quality preference, so a playback choice can never downgrade a NAS download.
export function playbackParams(track, source) {
  const values = track.brTypes || []
  const key = value => typeof value === 'string' ? value : value?.value
  const type = values.find(value => /mp3_320/i.test(key(value))) || values.find(value => /mp3/i.test(key(value))) || values[0]
  return { ...track, plugName: track.plugName || source, brType: key(type) }
}

export function downloadParams(track, source) {
  const { brType, downloadFormat, ...song } = track
  return { ...song, plugName: track.plugName || source }
}

export function qualityLabel(type = '') {
  const value = type.toLowerCase()
  if (value.includes('flac')) return 'FLAC 无损'
  if (value.includes('mp3')) return /320/.test(value) ? 'MP3 320 kbps' : /128/.test(value) ? 'MP3 128 kbps' : 'MP3'
  return value.match(/(?:^|_)(ape|wav|m4a|aac|ogg)(?:_|$)/)?.[1].toUpperCase() || '音质待确认'
}

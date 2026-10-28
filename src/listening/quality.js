const qualityKey = value => typeof value === 'string' ? value : value?.value
export function offeredQualities(track) {
  return [...new Set((track?.brTypes || []).map(qualityKey).filter(Boolean))].sort((a,b) => (Number(b.match(/(\d+)$/)?.[1]) || 0) - (Number(a.match(/(\d+)$/)?.[1]) || 0))
}
// Playback selects only advertised versions. No silent codec downgrade.
export function playbackParams(track, source, preference = 'auto') {
  const values = offeredQualities(track)
  const type = values.includes(preference) ? preference : values[0]
  return { ...track, plugName: track.plugName || source, brType: type }
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

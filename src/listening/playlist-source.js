const platforms = {
  qqvip: { id: 'qqvip', label: 'QQ 音乐', mark: 'Q' },
  qq: { id: 'qqvip', label: 'QQ 音乐', mark: 'Q' },
  netease: { id: 'netease', label: '网易云音乐', mark: 'N' },
  kw: { id: 'kw', label: '酷我音乐', mark: 'K' },
  kg: { id: 'kg', label: '酷狗音乐', mark: 'K' },
  mg: { id: 'mg', label: '咪咕音乐', mark: 'M' },
  local: { id: 'local', label: 'NAS 本地', mark: 'L' }
}
const unknown = { id: 'unknown', label: '来源未知', mark: '?' }

// A local playlist can contain platform tracks; its members do not define its origin.
export function playlistSource(playlist = {}) {
  if (playlist.kind === 'local') return platforms.local
  const source = playlist.source || playlist.provider || String(playlist.id || '').split(':')[0]
  return platforms[source] || unknown
}

export const playlistKindLabel = kind => ({ likes: '我喜欢', owned: '自建歌单', collected: '收藏歌单', local: '本地歌单' })[kind] || '歌单'

export function playbackOrigin(track, url = '') {
  if (!track) return { kind: 'pending', label: '准备音源', icon: 'music', detail: '正在确认播放来源' }
  if (track.local && /^\/api\/library\/stream\//.test(url)) {
    return { kind: 'nas', label: 'NAS 已下载', icon: 'server', detail: '读取 NAS 音乐库中已有的完整文件，播放时无需向音乐平台取流。' }
  }
  if (track.local) return { kind: 'pending', label: '读取 NAS', icon: 'server', detail: '正在打开 NAS 音乐文件。' }
  const provider = { qqvip: 'QQ 音乐', qq: 'QQ 音乐', kw: '酷我音乐', netease: '网易云音乐', tidal: 'Tidal', kg: '酷狗音乐' }[track.plugName] || '音乐平台'
  return { kind: 'online', label: '在线串流', icon: 'cloud', detail: `${provider}提供实时音源，浏览器直接播放。此播放路径不会把音频保存到 NAS，保存请使用下载功能。` }
}

export const visualModes = [
  { id: 'aurora', label: '流光', detail: '节拍光晕，三层声场', style: 0 },
  { id: 'spectrum', label: '频谱', detail: '真实频谱，瞬态峰值', style: 0 },
  { id: 'curtain', label: '极光', detail: '频率光幕，分层起伏', style: 1 },
  { id: 'stars', label: '星海', detail: '高频星点，随声闪烁', style: 2 },
  { id: 'orbit', label: '声环', detail: '环绕封面，频率描边', style: 3 },
  { id: 'still', label: '静谧', detail: '留下封面，安静听歌', style: 0 }
]
export const validVisualMode = value => visualModes.some(mode => mode.id === value) ? value : 'aurora'

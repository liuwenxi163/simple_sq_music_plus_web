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
  { id: 'aurora', label: '流光', detail: '液态色场，随声舒展', style: 0 },
  { id: 'spectrum', label: '频谱', detail: '频带柱阵，独立峰值', style: 0 },
  { id: 'curtain', label: '极光', detail: '纵向光幕，层层垂落', style: 1 },
  { id: 'stars', label: '星海', detail: '立体星流，随节拍穿行', style: 2 },
  { id: 'orbit', label: '声环', detail: '径向声纹，环绕封面', style: 3 },
  { id: 'vinyl', label: '黑胶', detail: '唱片转动，唱针轻落', style: 4 },
  { id: 'neon', label: '霓虹', detail: '穿行光隧，驶向节拍', style: 5 },
  { id: 'terrain', label: '山海', detail: '暮色山峦，随声起伏', style: 6 },
  { id: 'prism', label: '万花', detail: '棱镜折光，花瓣绽放', style: 7 },
  { id: 'water', label: '潮汐', detail: '水纹交织，波光流动', style: 8 },
  { id: 'ink', label: '纸墨', detail: '浅色纸面，水墨声纹', style: 9 },
  { id: 'still', label: '静谧', detail: '留下封面，安静听歌', style: 0 }
]
export const validVisualMode = value => visualModes.some(mode => mode.id === value) ? value : 'aurora'

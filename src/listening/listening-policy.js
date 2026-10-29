export const platformOf=track=>track&&!track.local?(['qq','qqvip'].includes(track.plugName)?'qqvip':track.plugName==='netease'?'netease':null):null
export function localRequest(track,quality='auto'){
  const text=quality.toLowerCase();const format=quality==='auto'?'auto':text.includes('flac')?'flac':text.includes('mp3')?'mp3':text.includes('m4a')?'m4a':'auto'
  return {provider:track.plugName,id:String(track.id),format,quality}
}
export function playlistTargets(track,local,contexts){
  const result=local.map(p=>({id:'local:'+p.id,name:p.name,destination:'NAS 本地歌单',localId:p.id}))
  const provider=platformOf(track)
  if(provider)for(const list of contexts[provider]?.playlists||[])if(list.kind==='owned')result.push({id:provider+':'+list.id,name:list.name,destination:provider==='qqvip'?'QQ 音乐 · 云端歌单':'网易云音乐 · 云端歌单',provider,remoteId:list.id})
  return result
}

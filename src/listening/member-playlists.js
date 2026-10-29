import { api } from './api'
export function memberPlaylists(provider,context){return (context.playlists||[]).map(p=>({...p,id:provider+':'+p.id,remoteId:p.id,source:provider,loaded:false}))}
export const playlistCount=p=>Array.isArray(p?.tracks)?p.tracks.length+' 首':p?.trackCount!=null?p.trackCount+' 首':'点击读取歌曲'
export async function ownPlaylists(){const {accounts=[]}=await api('/listening/platforms');const all=await Promise.all(accounts.map(async a=>memberPlaylists(a.id,await api('/listening/platforms/'+a.id+'/library'))));return all.flat()}

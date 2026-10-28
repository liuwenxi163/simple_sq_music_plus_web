<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { api, trackKey } from './api'
import Artwork from './Artwork.vue'
import Icon from './Icon.vue'
const props = defineProps({ playlists: {type:Array,default:()=>[]}, favorites:{type:Array,default:()=>[]} })
const emit = defineEmits(['play','update-local','download'])
const showCount = ref(100), filter = ref('')
const remote = ref({playlists:[]}), summary = ref({}), selectedId = ref(''), newName = ref(''), busy = ref(false), error = ref('')
let timer, polling = false
const lists = computed(() => [
  {id:'local:favorites',name:'本地喜欢',kind:'local',tracks:props.favorites.filter(t=>typeof t==='object')},
  ...props.playlists.map(p=>({...p,kind:'local'})), ...(remote.value.playlists || [])
])
const selected = computed(() => lists.value.find(p=>p.id===selectedId.value))
const kindLabel = kind => ({likes:'QQ · 我喜欢',owned:'QQ · 自建歌单',collected:'QQ · 收藏歌单',local:'本地歌单'})[kind]
const normalized = track => track.local ? track : {...track,title:track.name,artist:(track.artistName || []).join(' / '),album:track.albumName || '',coverUrl:track.pic,local:false}
const songs = computed(() => (selected.value?.tracks || []).map(normalized))
const matchingSongs = computed(() => songs.value.filter(t => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(filter.value.toLowerCase())))
const visibleSongs = computed(() => matchingSongs.value.slice(0,showCount.value))
watch(selectedId, () => {filter.value='';showCount.value=100})
const syncError = computed(() => ({DOWNLOAD_QUEUE_PARTIAL:`${summary.value.queueFailures || 0} 首歌曲未能加入下载，其余任务正常继续，下次同步会重试。`,QQ_LOGIN_REQUIRED:'QQ 登录已过期，请到账号设置重新扫码。',QQ_NETWORK_UNAVAILABLE:'QQ 接口暂时未响应，会在下次定时同步重试。',QQ_COLLECTION_INCOMPLETE:'QQ 返回的歌单不完整，已保留上次完整歌单，下次自动重试。',COLLECTION_LIMIT_REACHED:'本次同步达到处理上限，已保留上次完整歌单。',QQ_COLLECTION_UNAVAILABLE:'QQ 暂未提供完整歌单，已保留上次结果，可立即重试。'})[summary.value.error] || summary.value.error)
async function load() { remote.value = await api('/listening/collection'); summary.value = {...remote.value}; if(!selectedId.value) selectedId.value = remote.value.playlists?.[0]?.id || lists.value[0]?.id }
async function poll() {
  if(polling) return;polling = true
  try { const status = await api('/listening/collection/status'); const changed = status.lastSuccess !== summary.value.lastSuccess; summary.value = status; if(changed) await load() }
  catch(e) { error.value = e.message } finally {polling = false}
}
async function configure(key,value) {busy.value = true;error.value = '';try {summary.value = await api('/listening/collection',{enabled:!!summary.value.enabled,autoDownload:!!summary.value.autoDownload,[key]:value},'PUT')} catch(e){error.value=e.message} finally{busy.value=false}}
async function sync() {busy.value = true;error.value='';try {summary.value=await api('/listening/collection/sync',{})}catch(e){error.value=e.message}finally{busy.value=false}}
function create() {const name=newName.value.trim();if(!name)return;const playlist={id:'local:'+Date.now().toString(36)+Math.random().toString(36).slice(2,9),name,tracks:[]};emit('update-local',[...props.playlists,playlist]);selectedId.value=playlist.id;newName.value=''}
function remove(track) {emit('update-local',props.playlists.map(p=>p.id===selectedId.value?{...p,tracks:p.tracks.filter(t=>trackKey(t)!==trackKey(track))}:p))}
function date(value) {return value?new Date(value).toLocaleString():'尚未同步'}
onMounted(async()=>{try{await load()}catch(e){error.value=e.message}timer=setInterval(()=>{if(!document.hidden)poll()},3000)})
onUnmounted(()=>clearInterval(timer))
</script>
<template>
  <section class="account-sync" aria-label="QQ 账号同步"><div><h2>QQ 账号同步</h2><p class="muted">每 10 分钟读取“我喜欢”、自建及收藏歌单，并补下载新增歌曲。只读取 QQ，本地编辑保存在 NAS。</p><p class="muted">{{ summary.running ? (summary.phase || '正在同步账号歌单…') : '上次成功：' + date(summary.lastSuccess) }}<span v-if="summary.queuedLastRun != null"> · 最近新增下载 {{ summary.queuedLastRun }} 首</span></p></div><div class="sync-controls"><label><input type="checkbox" :checked="summary.enabled" :disabled="busy" @change="configure('enabled',$event.target.checked)" />定时同步</label><label><input type="checkbox" :checked="summary.autoDownload" :disabled="busy" @change="configure('autoDownload',$event.target.checked)" />自动下载新增歌曲</label><button class="quiet" :disabled="busy || summary.running" @click="sync"><Icon name="repeat" :size="16" />{{summary.running?'同步中…':'立即同步'}}</button></div></section>
  <p v-if="error || syncError" class="collection-error" role="alert">{{ error || syncError }}</p>
  <div class="collection-layout"><aside class="playlist-list" aria-label="歌单列表"><form class="playlist-create" @submit.prevent="create"><input v-model="newName" maxlength="100" placeholder="新歌单名称" aria-label="新歌单名称" required /><button class="icon-button" aria-label="新建本地歌单"><Icon name="plus" /></button></form><button v-for="list in lists" :key="list.id" class="playlist-item" :class="{selected:list.id===selectedId}" @click="selectedId=list.id"><Artwork :src="list.coverUrl || list.tracks?.[0]?.pic || list.tracks?.[0]?.coverUrl" /><span><strong>{{list.name}}</strong><small>{{kindLabel(list.kind)}} · {{list.tracks?.length || 0}} 首</small></span></button></aside><section class="playlist-detail" v-if="selected"><div class="playlist-heading"><span class="eyebrow">{{kindLabel(selected.kind)}}</span><h2>{{selected.name}}</h2><p class="muted">{{songs.length}} 首歌曲<span v-if="selected.kind==='local'"> · 从搜索结果或播放器加入歌曲</span></p><button class="primary" :disabled="!songs.length" @click="emit('play',songs[0],songs)"><Icon name="play" :size="18" />播放全部</button></div><p v-if="!songs.length" class="muted">歌单还没有歌曲，去发现音乐并选择“加入歌单”。</p><input v-if="songs.length" v-model="filter" class="playlist-filter" placeholder="筛选歌单中的歌曲" aria-label="筛选歌单中的歌曲" /><div v-for="track in visibleSongs" :key="trackKey(track)" class="result-row"><button class="track-main" @click="emit('play',track,songs)"><Artwork :src="track.coverUrl" /><span><strong>{{track.title}}</strong><small>{{track.artist}} · {{track.album}}</small></span></button><button class="icon-button" :aria-label="'播放 '+track.title" @click="emit('play',track,songs)"><Icon name="play" /></button><button v-if="!track.local" class="icon-button" :aria-label="'下载 '+track.title" @click="emit('download',track)"><Icon name="download" /></button><button v-if="selected.kind==='local' && selected.id!=='local:favorites'" class="icon-button" :aria-label="'移出歌单 '+track.title" @click="remove(track)"><Icon name="close" /></button></div><button v-if="visibleSongs.length < matchingSongs.length" class="quiet" @click="showCount += 100">再显示 100 首（共 {{matchingSongs.length}} 首）</button></section></div>
</template>
<style scoped>
.account-sync{display:flex;gap:32px;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:28px}.account-sync p{max-width:65ch;margin-top:12px}.sync-controls{display:grid;gap:12px;flex-shrink:0}.sync-controls label{display:flex;gap:10px;align-items:center;font-size:13px}.sync-controls input{min-height:20px;accent-color:var(--accent)}.collection-layout{display:grid;grid-template-columns:minmax(210px,290px) minmax(0,1fr);gap:38px;margin-top:30px}.playlist-list{display:flex;flex-direction:column;gap:5px}.playlist-create{display:flex;gap:5px;margin-bottom:16px}.playlist-create input{width:100%;font-size:12px}.playlist-item{display:flex;align-items:center;gap:12px;padding:12px;border-radius:8px;text-align:left}.playlist-item.selected{background:var(--raised);color:var(--accent)}.playlist-item .artwork{width:44px}.playlist-item span{min-width:0}.playlist-item strong,.playlist-item small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.playlist-item strong{font-size:13px}.playlist-item small{font-size:11px;color:var(--muted);margin-top:7px}.playlist-heading{display:grid;gap:16px;margin-bottom:28px}.playlist-heading h2{font-size:28px}.playlist-heading>.primary{justify-self:start}.playlist-detail{min-width:0}.playlist-filter{width:100%;margin-bottom:16px}.collection-error{color:oklch(80% .11 30);margin-top:18px}.playlist-detail .result-row .icon-button{width:36px;flex-shrink:0}@media(max-width:1000px){.collection-layout{grid-template-columns:minmax(170px,230px) minmax(0,1fr);gap:20px}}@media(max-width:760px){.account-sync{flex-direction:column;gap:22px}.sync-controls{grid-template-columns:1fr;gap:16px}.sync-controls .quiet{justify-self:start}.collection-layout{grid-template-columns:minmax(0,1fr)}.playlist-list{max-height:320px;overflow-y:auto}.playlist-heading{margin-top:16px}.playlist-detail .result-row{gap:0}.playlist-item .artwork{width:40px}}
</style>

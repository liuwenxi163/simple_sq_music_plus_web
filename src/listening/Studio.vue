<script setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import userInfoStore from '../stores/user'
import configInfoStore from '../stores/config'
import { api, parseLyrics, formatTime, trackKey } from './api'
import Icon from './Icon.vue'
import Artwork from './Artwork.vue'

const user = userInfoStore(), config = configInfoStore(), route = useRoute(), router = useRouter()
const view = computed(() => route.params.view || 'library')
const nav = [{ id: 'library', label: '音乐库', icon: 'library' }, { id: 'search', label: '发现音乐', icon: 'search' }, { id: 'favorites', label: '我喜欢', icon: 'heart' }, { id: 'downloads', label: '下载', icon: 'download' }, { id: 'tools', label: '更多', icon: 'settings' }]
const titles = { library: '属于你的音乐', search: '下一首，想听什么？', favorites: '喜欢，所以留在这里', downloads: '下载管理', tools: '让音乐库更完整', sync: '歌单同步', enrichment: '歌词与封面', settings: '设置', parser: '导入歌单', text: '文本导入', cloud: '云盘同步' }
const legacy = { sync: defineAsyncComponent(() => import('../components/Monitor.vue')), settings: defineAsyncComponent(() => import('../components/V3Set.vue')), parser: defineAsyncComponent(() => import('../components/V3ParserPlaylist.vue')), text: defineAsyncComponent(() => import('../components/V3Parsertext.vue')), cloud: defineAsyncComponent(() => import('../components/AliyunSync.vue')) }
const go = id => router.push('/' + id)
const busy = ref(false), error = ref(''), notice = ref(''), tracks = ref([]), total = ref(0), scan = ref({}), prefs = ref({ favorites: [], playlists: [], recent: [] })
const filter = ref(''), source = ref('qqvip'), keyword = ref(''), results = ref([]), searchPage = ref(1), searchTotal = ref(0), searching = ref(false), searched = ref(false)
const downloads = ref([]), downloadStatus = ref(''), jobs = ref([]), jobProvider = ref('tunehub'), enrichPath = ref(''), embed = ref(false)
const loginName = ref(''), loginPassword = ref(''), loginBusy = ref(false)
const fullPlayer = ref(null)
let previousFocus
const queue = ref([]), current = ref(null), playing = ref(false), preparing = ref(false), buffering = ref(false), elapsed = ref(0), duration = ref(0), volume = ref(Number(localStorage.getItem('sq-volume') ?? .8)), expanded = ref(false), showQueue = ref(false), shuffle = ref(false), repeat = ref('off'), audio = ref(null), lyricText = ref(''), lines = computed(() => parseLyrics(lyricText.value)), lyricElements = ref([])
let playGeneration = 0, timer, noticeTimer, stateTimer, prefsRevision = 0, dashPlayer
const sources = computed(() => config.option.length ? config.option : [{ label: 'QQ 音乐', value: 'qqvip' }, { label: '酷我音乐', value: 'kw' }, { label: '网易云音乐', value: 'netease' }])
const favoriteIds = computed(() => new Set(prefs.value.favorites.map(t => typeof t === "string" ? t : trackKey(t))))
const visibleTracks = computed(() => (view.value === "favorites" ? [...tracks.value.filter(t => favoriteIds.value.has(trackKey(t))), ...prefs.value.favorites.filter(t => typeof t === "object" && !t.local)] : tracks.value).filter(t => (!filter.value || `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(filter.value.toLowerCase())) && (view.value !== 'favorites' || favoriteIds.value.has(trackKey(t)))))
const albums = computed(() => { const map = new Map(); for (const t of tracks.value) { const k = `${t.artist}\n${t.album || t.id}`; if (!map.has(k)) map.set(k, { title: t.album || t.title, artist: t.artist, cover: t.coverUrl, songs: [] }); map.get(k).songs.push(t) } return [...map.values()].slice(0, 12) })
const activeLine = computed(() => { let found = -1; for (let i = 0; i < lines.value.length; i++) { if (lines.value[i].time > elapsed.value + .15) break; found = i } return found })
const progress = computed(() => duration.value ? Math.min(100, elapsed.value / duration.value * 100) : 0)
const isFavorite = t => t && favoriteIds.value.has(trackKey(t))
const active = t => current.value && trackKey(current.value) === trackKey(t)
function toast(message) { notice.value = message; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => notice.value = '', 4500) }
function report(e) { error.value = e.message || '请求失败，请重试' }
async function loadLibrary(append = false) {
  const data = await api('/library/tracks?limit=500&offset=' + (append ? tracks.value.length : 0))
  const batch = data.items.map(row => ({ ...row.track, local: true, coverUrl: row.coverUrl }))
  tracks.value = append ? [...tracks.value, ...batch] : batch; total.value = data.total; scan.value = data.scan
}
async function loadDownloads() { const data = await api('/task/list', { pageIndex: 1, pageSize: 100, downloadStatus: downloadStatus.value }); downloads.value = data.records || [] }
async function loadJobs() { jobs.value = (await api('/enrichment/jobs')).jobs || [] }
async function initialize() {
  if (!user.token) return
  busy.value = true; error.value = ''
  try {
    await api('/config/isLogin', {})
    const [settings, options, state] = await Promise.all([api('/config/getConfigList'), api('/config/getOption'), api('/library/state')])
    config.setData(settings); config.setOption(options); prefs.value = state
    if (!sources.value.some(x => x.value === source.value)) source.value = sources.value[0]?.value || 'kw'
    await loadLibrary()
  } catch (e) { report(e) } finally { busy.value = false }
}
async function login() {
  loginBusy.value = true; error.value = ''
  try { const data = await api('/config/login', { username: loginName.value, password: loginPassword.value, device: 'web' }); user.setToken(data.tokenValue); user.setUserName(loginName.value); user.setLoginDevice(data.loginDevice); loginPassword.value = ''; go('library'); await initialize() } catch (e) { report(e) } finally { loginBusy.value = false }
}
async function logout() { try { await api('/config/logout', { device: user.loginDevice || 'web' }) } catch {} audio.value?.pause(); user.clearUserInfo(); current.value = null; tracks.value = [] }
function persist() {
  const revision = ++prefsRevision
  clearTimeout(stateTimer)
  stateTimer = setTimeout(async () => { try { const state = await api('/library/state', prefs.value, 'PUT'); if (revision === prefsRevision) prefs.value = state } catch { toast('收藏保存失败，请检查连接后重试') } }, 350)
}
function favorite(t) { const key = trackKey(t); prefs.value.favorites = isFavorite(t) ? prefs.value.favorites.filter(x => (typeof x === "string" ? x : trackKey(x)) !== key) : [...prefs.value.favorites, t.local ? key : t]; persist() }
function normalize(t) { return { ...t, plugName: t.plugName || source.value, title: t.name, artist: (t.artistName || []).join(' / '), album: t.albumName || '', coverUrl: t.pic, duration: Number(t.duration || 0) / 1000, local: false } }
async function search(page = 1) {
  if (!keyword.value.trim() || searching.value) return
  searching.value = true; error.value = ''; searched.value = true
  try { const data = await api(`/music/searchSong?plugName=${encodeURIComponent(source.value)}&keyword=${encodeURIComponent(keyword.value.trim())}&pageSize=30&pageIndex=${page}`); results.value = (data.records || []).map(normalize); searchTotal.value = data.searchTotal || 0; searchPage.value = page } catch (e) { report(e) } finally { searching.value = false }
}
function br(t) { const values = t.brTypes || []; return values.find(x => /mp3_320/i.test(typeof x === 'string' ? x : x.value)) || values.find(x => /mp3/i.test(typeof x === 'string' ? x : x.value)) || values[0] }
function params(t) { const type = br(t); return { ...t, id: t.id, plugName: t.plugName || source.value, brType: typeof type === 'string' ? type : type?.value } }
async function download(t) { try { await api('/download/downloadSong', params(t)); toast('已加入 NAS 下载任务') } catch (e) { report(e) } }
async function play(t, list) {
  if (!t) return
  if (t.local && !t.playable) { toast('浏览器不支持此音频格式，可在下载设置中选择 MP3'); return }
  const generation = ++playGeneration
  audio.value.pause(); dashPlayer?.reset(); dashPlayer = null; audio.value.removeAttribute('src'); audio.value.load(); buffering.value = false
  current.value = t; if (list) queue.value = [...list]; elapsed.value = 0; duration.value = 0; preparing.value = true; lyricText.value = ''; error.value = ''
  try {
    let url
    if (t.local) {
      url = (await api('/library/ticket/' + t.id, {})).url
      api('/library/lyrics/' + t.id).then(text => { if (generation === playGeneration) lyricText.value = text || '' }).catch(() => {})
    } else {
      const data = await api('/music/getDownloadUrl', params(t)); url = data?.url
      if (!url) throw new Error(data?.errorMsg || '音源未提供可播放链接，请更换音质或检查账号登录')
      api('/music/getLyric', { id: t.lyricId || t.id, plugName: t.plugName }).then(text => { if (generation === playGeneration) lyricText.value = typeof text === 'string' ? text : text?.lyric || '' }).catch(() => {})
    }
    if (generation !== playGeneration) return
    if (url.includes('.mpd') || url.startsWith('data:application/dash')) {
      const dashjs = await import('dashjs'); if (generation !== playGeneration) return
      dashPlayer = dashjs.MediaPlayer().create(); dashPlayer.initialize(audio.value, url, true)
    } else { audio.value.src = url; audio.value.load(); await audio.value.play() }
    prefs.value.recent = [trackKey(t), ...prefs.value.recent.filter(k => k !== trackKey(t))].slice(0, 100); persist()
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album, artwork: t.coverUrl ? [{ src: new URL(t.coverUrl, location.origin).href }] : [] })
  } catch (e) { if (generation === playGeneration) { playing.value = false; error.value = e.name === 'NotAllowedError' ? '轻点播放，继续听歌' : e.message || '当前音频暂时无法播放'; toast(error.value) } } finally { if (generation === playGeneration) preparing.value = false }
}
async function toggle() { if (!current.value) return; if (playing.value) audio.value.pause(); else { try { await audio.value.play() } catch { await play(current.value) } } }
function step(delta = 1, ended = false) {
  if (ended && repeat.value === 'one') { audio.value.currentTime = 0; audio.value.play().catch(() => {}); return }
  if (delta < 0 && elapsed.value > 3) { audio.value.currentTime = 0; return }
  const index = queue.value.findIndex(active)
  const next = shuffle.value ? Math.floor(Math.random() * queue.value.length) : index + delta
  if (next >= 0 && next < queue.value.length) play(queue.value[next]); else if (repeat.value === 'all' && queue.value.length) play(queue.value[(next + queue.value.length) % queue.value.length])
}
function seek(value) { if (Number.isFinite(duration.value) && duration.value > 0) audio.value.currentTime = Number(value) }
function mediaError() { if (current.value && !preparing.value) { buffering.value = false; error.value = audio.value?.error?.code === 2 ? '音频连接中断，请重试' : '浏览器无法播放返回的音频，请重试或换用 MP3 音质'; toast(error.value) } }
async function scanLibrary() { try { scan.value = await api('/library/scan', {}); toast('正在扫描音乐目录，完成后自动刷新') } catch (e) { report(e) } }
async function retryDownload(id) { try { await api('/task/refreshTask', { id }); await loadDownloads() } catch (e) { report(e) } }
async function enrich() { try { await api('/enrichment/jobs', { path: enrichPath.value, provider: jobProvider.value, embed: embed.value }); toast('整理任务已加入队列'); await loadJobs() } catch (e) { report(e) } }
function keyboard(e) { if (expanded.value && e.code === 'Tab') { const buttons = [...document.querySelectorAll('.immersive-player button:not(:disabled), .immersive-player input, .queue-panel button')]; const first = buttons[0], last = buttons.at(-1); if (e.shiftKey && (document.activeElement === first || !buttons.includes(document.activeElement))) { e.preventDefault(); last?.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() } return } if (e.code === 'Escape') { expanded.value = false; showQueue.value = false; return } if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) || e.target.isContentEditable || e.ctrlKey || e.metaKey) return; if (e.code === 'Space') { e.preventDefault(); toggle() } if (e.code === 'Escape') { expanded.value = false; showQueue.value = false } }
watch(volume, v => { if (audio.value) audio.value.volume = v; localStorage.setItem('sq-volume', v) })
watch(expanded, async value => { document.body.style.overflow = value ? 'hidden' : ''; if (value) { previousFocus = document.activeElement; await nextTick(); fullPlayer.value?.querySelector('button')?.focus() } else previousFocus?.focus() })
watch(activeLine, async index => { if (!expanded.value || index < 0) return; await nextTick(); lyricElements.value[index]?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }) })
watch(view, async () => { error.value = ''; if (!user.token) return; try { if (view.value === 'downloads') await loadDownloads(); if (view.value === 'enrichment') await loadJobs() } catch (e) { report(e) } })
watch(downloadStatus, () => loadDownloads().catch(report))
onMounted(() => {
  audio.value.volume = volume.value; initialize(); document.addEventListener('keydown', keyboard)
  timer = setInterval(async () => { if (!user.token || document.hidden) return; try { if (scan.value.running) { const status = await api('/library/scan'); scan.value = status; if (!status.running) await loadLibrary() } if (view.value === 'downloads') await loadDownloads(); if (view.value === 'enrichment') await loadJobs() } catch {} }, 6000)
  if ('mediaSession' in navigator) { for (const [name, fn] of Object.entries({ play: toggle, pause: () => audio.value.pause(), previoustrack: () => step(-1), nexttrack: () => step(1), seekto: e => seek(e.seekTime) })) try { navigator.mediaSession.setActionHandler(name, fn) } catch {} }
})
onUnmounted(() => { document.body.style.overflow = ''; clearInterval(timer); clearTimeout(noticeTimer); clearTimeout(stateTimer); dashPlayer?.reset(); document.removeEventListener('keydown', keyboard) })
</script>

<template>
  <audio ref="audio" preload="metadata" @timeupdate="elapsed = audio.currentTime" @durationchange="duration = Number.isFinite(audio.duration) ? audio.duration : 0" @play="playing = true" @pause="playing = false" @playing="buffering = false" @waiting="buffering = true" @canplay="buffering = false" @error="mediaError" @ended="step(1, true)" />
  <main v-if="!user.token" class="login-scene">
    <div class="login-intro"><span class="wordmark"><Icon name="music" :size="28" /> SQ MUSIC <small>LISTENING ROOM</small></span><h1>让喜欢的音乐，<br />有一个自己的家。</h1><p>从收藏到播放，留在你的 NAS。</p><div class="record-shape" aria-hidden="true"><span></span></div></div>
    <form class="login-form" @submit.prevent="login"><span class="eyebrow">WELCOME BACK</span><h2>回到音乐里</h2><label>用户名<input v-model="loginName" autocomplete="username" required /></label><label>密码<input v-model="loginPassword" type="password" autocomplete="current-password" required /></label><p v-if="error" role="alert" class="inline-error">{{ error }}</p><button class="primary" :disabled="loginBusy">{{ loginBusy ? '正在登录…' : '登录音乐库' }}<Icon name="arrow" /></button><p class="muted">使用现有 SQMusic 账号登录</p></form>
  </main>
  <div v-else class="studio" :class="{ 'has-player': current }">
    <aside class="sidebar" :inert="expanded ? '' : null"><a class="wordmark" href="#/library"><Icon name="music" :size="27" /><span>SQ MUSIC<small>LISTENING ROOM</small></span></a><span class="nav-caption">你的音乐空间</span><nav><button v-for="item in nav" :key="item.id" :class="{ selected: view === item.id }" @click="go(item.id)"><Icon :name="item.icon" /><span>{{ item.label }}</span></button></nav><div class="sidebar-note"><span class="connection-dot"></span>NAS 音乐库<small>随时回来，接着听。</small></div><button class="account-button" @click="logout" title="退出登录"><span class="avatar">{{ user.username.slice(0, 1).toUpperCase() }}</span><span>{{ user.username }}<small>退出登录</small></span></button></aside>
    <section class="workspace" :inert="expanded ? '' : null">
      <header class="topbar"><span class="breadcrumb">我的音乐空间 <span>/</span> {{ nav.find(n => n.id === view)?.label || titles[view] }}</span><button class="icon-button" aria-label="刷新音乐库" @click="initialize"><Icon name="refresh" /></button></header>
      <div class="page-content">
        <div class="page-heading"><div><span class="eyebrow">{{ view === 'library' ? 'YOUR PERSONAL COLLECTION' : 'SQ MUSIC · LISTENING ROOM' }}</span><h1>{{ titles[view] || '音乐库' }}</h1></div><button v-if="view === 'library'" class="quiet" :disabled="scan.running" @click="scanLibrary"><Icon name="refresh" />{{ scan.running ? `扫描中 · ${scan.scanned}` : '扫描曲库' }}</button></div>
        <div v-if="error" class="error-banner" role="alert">{{ error }}<button @click="initialize">重试</button></div>
        <template v-if="['library', 'favorites'].includes(view)">
          <section v-if="view === 'library' && albums.length" class="album-section"><div class="section-heading"><h2>最近加入</h2><span class="muted">来自你的收藏</span></div><div class="album-grid"><button v-for="(album, i) in albums" :key="i" class="album-tile" @click="play(album.songs[0], album.songs)"><span class="album-picture"><Artwork :src="album.cover" /><span class="album-play"><Icon name="play" :size="23" /></span></span><strong>{{ album.title }}</strong><span>{{ album.artist }}</span></button></div></section>
          <div class="section-heading library-toolbar"><div><h2>{{ view === 'favorites' ? '收藏曲目' : '全部曲目' }}</h2><span class="muted">{{ view === 'favorites' ? visibleTracks.length : total }} 首音乐</span></div><label class="filter-input"><Icon name="search" :size="18" /><input v-model="filter" placeholder="筛选你的音乐" aria-label="筛选音乐" /></label></div>
          <div v-if="busy" class="skeleton-list" aria-label="正在加载音乐"><div v-for="n in 5" :key="n"></div></div>
          <div v-else-if="!visibleTracks.length" class="empty-state"><div class="empty-art"><Icon :name="view === 'favorites' ? 'heart' : 'music'" :size="46" /></div><h2>{{ view === 'favorites' ? '从一首喜欢的歌开始' : '你的音乐，即将登场' }}</h2><p>{{ view === 'favorites' ? '轻点歌曲旁的爱心，收进专属收藏。' : '搜索音乐或导入歌单，下载后会出现在这里。已有文件可以扫描曲库。' }}</p><button class="primary" @click="go('search')">发现音乐<Icon name="arrow" /></button></div>
          <div v-else class="track-list"><div class="track-list-head"><span>#</span><span>歌曲 / 艺术家</span><span>专辑</span><span>格式</span><span>时长</span><span></span></div><div v-for="(t, i) in visibleTracks" :key="trackKey(t)" class="track-row" :class="{ active: active(t) }"><button class="row-play" :aria-label="'播放 ' + t.title" @click="play(t, visibleTracks)"><span class="track-number">{{ i + 1 }}</span><Icon name="play" :size="17" /><span v-if="active(t) && playing" class="equalizer"><i></i><i></i><i></i></span></button><button class="track-main" @click="play(t, visibleTracks)"><Artwork :src="t.coverUrl" /><span><strong>{{ t.title }}</strong><small>{{ t.artist }}</small></span></button><span class="track-album">{{ t.album || '单曲' }}</span><span class="format-badge">{{ t.format }}</span><span class="track-duration">{{ formatTime(t.duration) }}</span><button class="icon-button favorite" :class="{ liked: isFavorite(t) }" :aria-label="isFavorite(t) ? '取消喜欢' : '喜欢这首歌'" @click="favorite(t)"><Icon name="heart" :size="18" /></button></div><button v-if="tracks.length < total" class="quiet" @click="loadLibrary(true).catch(report)">加载更多曲目</button></div>
        </template>
        <template v-else-if="view === 'search'">
          <form class="search-form" @submit.prevent="search(1)"><Icon name="search" :size="23" /><input v-model="keyword" placeholder="搜索歌曲、艺术家" aria-label="搜索歌曲或艺术家" required /><select v-model="source" aria-label="音乐来源"><option v-for="option in sources" :key="option.value" :value="option.value">{{ option.label }}</option></select><button class="primary" :disabled="searching">{{ searching ? '搜索中…' : '搜索' }}</button></form>
          <div class="search-hint"><span>从你使用的音乐平台，找到喜欢的声音。</span><button class="text-button" @click="go('parser')">导入已有歌单 <Icon name="arrow" :size="16" /></button></div>
          <div v-if="searching" class="skeleton-list"><div v-for="n in 6" :key="n"></div></div>
          <div v-else-if="results.length" class="search-results"><div class="section-heading"><h2>搜索结果</h2><span class="muted">{{ searchTotal }} 首</span></div><div v-for="t in results" :key="trackKey(t)" class="result-row"><button class="track-main" @click="play(t, results)"><Artwork :src="t.coverUrl" /><span><strong>{{ t.title }}</strong><small>{{ t.artist }} · {{ t.album }}</small></span></button><button class="icon-button" aria-label="播放" @click="play(t, results)"><Icon name="play" /></button><button class="icon-button" aria-label="下载到 NAS" @click="download(t)"><Icon name="download" /></button></div><div class="pagination"><button class="quiet" :disabled="searchPage <= 1" @click="search(searchPage - 1)">上一页</button><span>第 {{ searchPage }} 页</span><button class="quiet" :disabled="searchPage * 30 >= searchTotal" @click="search(searchPage + 1)">下一页</button></div></div>
          <div v-else class="empty-state"><Icon name="search" :size="46" /><h2>{{ searched ? '暂时没有找到' : '好音乐，从一次搜索开始' }}</h2><p>{{ searched ? '试试更短的歌名，或切换音乐来源。' : '在线播放或下载到 NAS，收进自己的音乐库。' }}</p></div>
        </template>
        <template v-else-if="view === 'downloads'"><div class="section-heading"><p class="muted">文件保存到 NAS，完成后扫描即可收进音乐库。</p><select v-model="downloadStatus" aria-label="下载状态"><option value="">全部任务</option><option value="loading">下载中</option><option value="waiting">等待中</option><option value="success">已完成</option><option value="error">失败</option></select></div><div v-if="!downloads.length" class="empty-state"><Icon name="download" :size="46" /><h2>下载清单很安静</h2><p>搜索音乐，轻点下载即可添加任务。</p><button class="primary" @click="go('search')">去找音乐</button></div><div v-for="job in downloads" :key="job.id" class="job-row"><span class="job-icon"><Icon name="download" /></span><div><strong>{{ job.downloadMusicname }}</strong><small>{{ job.downloadArtistname }} · {{ job.downloadAlbumname }}</small><p v-if="job.downloadMsg" class="muted">{{ job.downloadMsg }}</p></div><span class="status" :data-state="job.downloadStatus">{{ ({ waiting: '等待下载', loading: '正在下载', success: '已完成', error: '失败', retry: '等待重试', supplement: '补充中', supplement_success: '补充完成' })[job.downloadStatus] || job.downloadStatus }}</span><button v-if="job.downloadStatus === 'error'" class="quiet" @click="retryDownload(job.id)">重试</button></div></template>
        <template v-else-if="view === 'tools'"><div class="tool-list"><button v-for="tool in [{ id: 'favorites', title: '我喜欢', text: '把喜欢的歌，放在一起。', icon: 'heart' }, { id: 'sync', title: '歌单同步', text: '关注歌单与艺术家，持续收集喜欢的音乐。', icon: 'repeat' }, { id: 'parser', title: '导入歌单', text: '粘贴歌单链接，把收藏带回自己的音乐库。', icon: 'plus' }, { id: 'enrichment', title: '歌词与封面', text: '通过 LyricFlow，补齐音乐的另一半。', icon: 'lyrics' }, { id: 'settings', title: '音乐平台与设置', text: '账号登录、下载目录、音质与其他选项。', icon: 'settings' }, { id: 'text', title: '文本导入', text: '从歌曲名称清单批量添加下载。', icon: 'library' }, { id: 'cloud', title: '云盘同步', text: '管理已有的云盘同步配置。', icon: 'repeat' }]" :key="tool.id" @click="go(tool.id)"><Icon :name="tool.icon" :size="27" /><span><strong>{{ tool.title }}</strong><small>{{ tool.text }}</small></span><Icon name="arrow" /></button><button class="mobile-account" @click="logout"><Icon name="settings" /><span><strong>{{ user.username }}</strong><small>退出登录</small></span></button></div></template>
        <template v-else-if="view === 'enrichment'"><div class="enrich-intro"><h2>让封面和歌词，各就各位。</h2><p>默认仅补全缺少的 .lrc 歌词与 cover.jpg，不覆盖已有文件。完成后扫描曲库，即可在播放器中使用。</p></div><form class="enrich-form" @submit.prevent="enrich"><label>音乐子目录<input v-model="enrichPath" placeholder="留空整理整个音乐库" /></label><label>匹配服务<select v-model="jobProvider"><option value="tunehub">TuneHub</option><option value="lrcapi">LrcApi</option></select></label><label class="check-label"><input v-model="embed" type="checkbox" />同时补齐文件内缺失的标签、歌词和封面</label><button class="primary">开始整理<Icon name="arrow" /></button></form><div class="section-heading"><h2>整理记录</h2><button class="quiet" @click="loadJobs().catch(report)">刷新</button></div><p v-if="!jobs.length" class="muted">还没有整理任务。</p><div v-for="job in jobs" :key="job.id" class="job-row"><Icon name="lyrics" /><div><strong>{{ job.path || '整个音乐库' }}</strong><small>{{ job.provider }} · 已扫描 {{ job.stats?.scanned || 0 }} 首，歌词 {{ job.stats?.lyrics_saved || 0 }}，封面 {{ job.stats?.covers_saved || 0 }}，失败 {{ job.stats?.failed || 0 }}</small></div><span class="status">{{ ({ queued: '排队中', running: '整理中', done: '已完成', failed: '失败', interrupted: '已中断' })[job.state] || job.state }}</span><button v-if="['failed', 'interrupted'].includes(job.state)" class="quiet" @click="api('/enrichment/jobs/' + job.id + '/retry', {}).then(loadJobs).catch(report)">重试</button></div><p class="attribution">由 <a href="https://github.com/laoning666/lyricFlow" target="_blank" rel="noopener">LyricFlow</a> 提供整理能力，遵循 CC BY-NC 4.0，仅限非商业使用。</p></template>
        <div v-else-if="legacy[view]" class="legacy-tool"><button class="text-button" @click="go('tools')">返回更多功能</button><component :is="legacy[view]" /></div>
      </div>
    </section>
    <Transition name="notice"><div v-if="notice" class="toast" role="status">{{ notice }}</div></Transition>
    <footer v-if="current" class="player-bar" :inert="expanded ? '' : null"><button class="now-playing" @click="expanded = true"><Artwork :src="current.coverUrl" /><span><strong>{{ current.title }}</strong><small>{{ current.artist }}</small></span></button><button class="icon-button bar-favorite" :class="{ liked: isFavorite(current) }" aria-label="喜欢当前歌曲" @click="favorite(current)"><Icon name="heart" :size="19" /></button><div class="bar-transport"><div class="transport"><button class="icon-button secondary-control" :class="{ toggled: shuffle }" aria-label="随机播放" :aria-pressed="shuffle" @click="shuffle = !shuffle"><Icon name="shuffle" :size="18" /></button><button class="icon-button" aria-label="上一首" @click="step(-1)"><Icon name="prev" :size="19" /></button><button class="play-button" :aria-label="playing ? '暂停' : '播放'" :disabled="preparing" @click="toggle"><span v-if="preparing || buffering" class="loading-ring"></span><Icon v-else :name="playing ? 'pause' : 'play'" :size="23" /></button><button class="icon-button" aria-label="下一首" @click="step(1)"><Icon name="next" :size="19" /></button><button class="icon-button secondary-control" :class="{ toggled: repeat !== 'off' }" :aria-label="'循环模式：' + ({ off: '关闭', all: '列表循环', one: '单曲循环' })[repeat]" @click="repeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'"><Icon name="repeat" :size="18" /><small v-if="repeat === 'one'">1</small></button></div><div class="seek-row"><time>{{ formatTime(elapsed) }}</time><input type="range" aria-label="播放进度" min="0" :max="duration || 1" step=".1" :value="elapsed" @input="seek($event.target.value)" /><time>{{ formatTime(duration) }}</time></div></div><div class="player-extras"><button class="icon-button" aria-label="展开歌词" @click="expanded = true"><Icon name="lyrics" /></button><button class="icon-button" :class="{ toggled: showQueue }" aria-label="播放队列" @click="showQueue = !showQueue"><Icon name="queue" /></button><Icon name="volume" :size="18" /><input v-model.number="volume" aria-label="音量" type="range" min="0" max="1" step=".01" /></div><div class="mobile-progress" :style="{ transform: `scaleX(${progress / 100})` }"></div></footer>
    <nav class="mobile-nav" :inert="expanded ? '' : null"><button v-for="item in nav.filter(n => n.id !== 'favorites')" :key="item.id" :class="{ selected: view === item.id }" @click="go(item.id)"><Icon :name="item.icon" :size="22" /><span>{{ item.label }}</span></button></nav>
    <Transition name="panel"><aside v-if="showQueue" class="queue-panel"><div class="section-heading"><h2>接下来播放</h2><button class="icon-button" aria-label="关闭队列" @click="showQueue = false"><Icon name="close" /></button></div><div v-for="t in queue" :key="trackKey(t)" class="queue-row" :class="{ active: active(t) }"><button class="track-main" @click="play(t)"><Artwork :src="t.coverUrl" /><span><strong>{{ t.title }}</strong><small>{{ t.artist }}</small></span></button></div></aside></Transition>
    <Transition name="immersive"><section v-if="expanded && current" ref="fullPlayer" class="immersive-player" role="dialog" aria-modal="true" aria-label="正在播放" @keydown.esc="expanded = false"><div class="ambient-art" :style="current.coverUrl ? { backgroundImage: `url(${JSON.stringify(current.coverUrl)})` } : {}"></div><header><button class="icon-button" aria-label="收起播放器" @click="expanded = false"><Icon name="down" :size="26" /></button><span class="eyebrow">正在播放 · {{ current.local ? '我的音乐库' : '在线音乐' }}</span><button class="icon-button" aria-label="显示播放队列" @click="showQueue = !showQueue"><Icon name="queue" /></button></header><div class="immersive-content"><div class="record-column"><Artwork :src="current.coverUrl" :class="{ breathing: playing }" /><div class="song-heading"><div><h1>{{ current.title }}</h1><p>{{ current.artist }}<span v-if="current.album"> · {{ current.album }}</span></p></div><button class="icon-button" :class="{ liked: isFavorite(current) }" aria-label="喜欢当前歌曲" @click="favorite(current)"><Icon name="heart" :size="25" /></button></div><div class="full-seek"><input type="range" aria-label="播放进度" min="0" :max="duration || 1" step=".1" :value="elapsed" @input="seek($event.target.value)" /><div><time>{{ formatTime(elapsed) }}</time><time>{{ formatTime(duration) }}</time></div></div><div class="transport full-transport"><button class="icon-button" :class="{ toggled: shuffle }" aria-label="随机播放" @click="shuffle = !shuffle"><Icon name="shuffle" /></button><button class="icon-button" aria-label="上一首" @click="step(-1)"><Icon name="prev" :size="26" /></button><button class="play-button" :disabled="preparing" :aria-label="playing ? '暂停' : '播放'" @click="toggle"><span v-if="preparing || buffering" class="loading-ring"></span><Icon v-else :name="playing ? 'pause' : 'play'" :size="30" /></button><button class="icon-button" aria-label="下一首" @click="step(1)"><Icon name="next" :size="26" /></button><button class="icon-button" :class="{ toggled: repeat !== 'off' }" aria-label="切换循环模式" @click="repeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'"><Icon name="repeat" /><small v-if="repeat === 'one'">1</small></button></div></div><div class="lyrics-column"><span class="eyebrow">LYRICS</span><div v-if="lines.length" class="lyric-scroll"><button v-for="(line, i) in lines" :key="i" :ref="el => lyricElements[i] = el" :class="{ 'current-line': activeLine === i, 'past-line': i < activeLine }" @click="seek(line.time)">{{ line.text }}</button></div><div v-else class="lyrics-empty"><Icon name="lyrics" :size="34" /><p>{{ lyricText || '听音乐，也听此刻。' }}</p><small>{{ lyricText ? '' : '这首歌暂时没有同步歌词' }}</small></div></div></div></section></Transition>
  </div>
</template>

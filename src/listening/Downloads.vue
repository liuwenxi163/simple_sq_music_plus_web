<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { api, formatTime } from './api'
import { qualityLabel } from './quality'
import DownloadSettings from './DownloadSettings.vue'
import Artwork from './Artwork.vue'
import Icon from './Icon.vue'
const emit = defineEmits(['play'])
const tab = ref('active'), page = ref(1), items = ref([]), total = ref(0), loading = ref(true), error = ref(''), local = ref([]), localTotal = ref(0)
let timer, inFlight = false, generation = 0
const bytes = value => value >= 1048576 ? (value / 1048576).toFixed(1) + ' MiB' : value >= 1024 ? (value / 1024).toFixed(0) + ' KiB' : value + ' B'
const labels = { waiting: '等待下载', loading: '正在下载', success: '已完成', error: '失败', retry: '等待重试', supplement: '补充中', supplement_success: '已完成' }
async function refresh() {
  if (inFlight) return
  inFlight = true; const request = generation
  try {
    if (tab.value === 'library') {
      const result = await api('/library/tracks?limit=500&offset=' + ((page.value - 1) * 500))
      if (request !== generation) return
      local.value = result.items.map(row => ({ ...row.track, local: true, coverUrl: row.coverUrl })); localTotal.value = result.total
    } else {
      const result = await api('/listening/downloads?tab=' + tab.value + '&page=' + page.value)
      if (request !== generation) return
      items.value = result.items; total.value = result.total
    }
    error.value = ''
  } catch (e) { if (request === generation) error.value = e.message }
  finally { inFlight = false; if (request === generation) loading.value = false }
}
async function select(value) { generation++; tab.value = value; page.value = 1; loading.value = true; if (value === 'library') await api('/library/scan', {}).catch(e => error.value = e.message); await refresh() }
async function retry(job) { try { await api('/task/refreshTask', { id: job.id }); await select('active') } catch (e) { error.value = e.message } }
async function turn(delta) { page.value += delta; await refresh() }
onMounted(() => { refresh(); timer = setInterval(() => { if (!document.hidden) refresh() }, 2000) })
onUnmounted(() => { clearInterval(timer); generation++ })
</script>
<template>
  <details class="download-preferences"><summary><span><Icon name="settings" :size="18" />下载偏好<small>音质与保存方式</small></span><Icon name="down" :size="16" /></summary><DownloadSettings /></details>
  <div class="download-tabs" role="group" aria-label="下载分类"><button v-for="option in [{id:'active',name:'下载中'},{id:'library',name:'已下载'},{id:'failed',name:'失败'},{id:'all',name:'全部记录'}]" :key="option.id" class="quiet" :class="{selected:tab===option.id}" @click="select(option.id)">{{ option.name }}</button></div>
  <p v-if="error" class="inline-error" role="alert">{{ error }} <button class="text-button" @click="refresh">重试</button></p>
  <div v-if="loading" class="skeleton-list" aria-label="正在读取下载"><div v-for="n in 3" :key="n"></div></div>
  <template v-else-if="tab === 'library'">
    <div class="section-heading"><p class="muted">NAS 中的音乐文件，共 {{ localTotal }} 首。完成下载后会自动刷新索引。</p><button class="quiet" @click="select('library')">扫描文件</button></div>
    <div v-if="!local.length" class="empty-state"><Icon name="library" :size="40" /><h2>还没有已下载的音乐</h2><p>下载完成后，歌曲会出现在这里。</p></div>
    <div v-for="track in local" :key="track.id" class="result-row"><button class="track-main" @click="emit('play',track,local)"><Artwork :src="track.coverUrl" /><span><strong>{{ track.title }}</strong><small>{{ track.artist }} · {{ track.album }}</small></span></button><span class="format-badge">{{ track.format.toUpperCase() }}</span><span class="muted">{{ bytes(track.size) }} · {{ formatTime(track.duration) }}</span><button class="icon-button" :aria-label="'播放 ' + track.title" @click="emit('play',track,local)"><Icon name="play" /></button></div>
  </template>
  <template v-else>
    <p class="muted">{{ tab === 'active' ? '解析音源、传输文件和整理标签会分别显示。' : '下载记录保存在服务器，刷新网页后仍可查看。' }} 共 {{ total }} 项。</p>
    <div v-if="!items.length" class="empty-state"><Icon name="download" :size="40" /><h2>{{ tab === 'failed' ? '没有失败的任务' : tab === 'active' ? '当前没有下载任务' : '还没有下载记录' }}</h2></div>
    <div v-for="job in items" :key="job.id" class="download-job"><div class="download-job-heading"><div><strong>{{ job.downloadMusicname }}</strong><small>{{ job.downloadArtistname }} · {{ job.downloadAlbumname }} · {{ qualityLabel(job.downloadBrType) }}</small></div><span class="status" :data-state="job.downloadStatus">{{ labels[job.downloadStatus] || job.downloadStatus }}</span><button v-if="job.downloadStatus === 'error'" class="quiet" @click="retry(job)">重试</button></div>
      <template v-if="['loading','supplement'].includes(job.downloadStatus)"><progress :value="job.progress.percent ?? undefined" max="100" :aria-label="job.downloadMusicname + ' 下载进度'"></progress><p class="muted" role="status">{{ job.progress.stage === 'preparing' ? '正在解析音源…' : job.progress.stage === 'tagging' ? '文件已传输，正在整理封面和标签…' : `${job.progress.percent == null ? '传输中' : job.progress.percent + '%'} · ${bytes(job.progress.bytes)}${job.progress.total > 0 ? ' / ' + bytes(job.progress.total) : ''} · ${bytes(job.progress.bytesPerSecond)}/s` }}</p></template>
      <p v-if="job.downloadMsg" class="muted">{{ job.downloadMsg }}</p>
    </div>
  </template>
  <div v-if="(tab === 'library' ? localTotal > 500 : total > 50)" class="pagination"><button class="quiet" :disabled="page <= 1" @click="turn(-1)">上一页</button><span>第 {{ page }} 页</span><button class="quiet" :disabled="page * (tab === 'library' ? 500 : 50) >= (tab === 'library' ? localTotal : total)" @click="turn(1)">下一页</button></div>
</template>
<style scoped>
.download-preferences{border:1px solid var(--line);border-radius:9px;background:oklch(21% .014 255);padding:0 20px}.download-preferences summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;min-height:62px;font-size:12px}.download-preferences summary::-webkit-details-marker{display:none}.download-preferences summary>span{display:flex;align-items:center;gap:12px}.download-preferences summary svg{color:var(--accent)}.download-preferences summary small{color:var(--muted);font-size:10px;margin-left:6px}.download-tabs button{background:transparent;border:0;border-radius:0;color:var(--muted);padding:0 8px;min-height:44px}.download-tabs{gap:24px!important;border-bottom:1px solid var(--line);margin-bottom:24px!important}.download-tabs button.selected{color:var(--text)!important;background:transparent!important;box-shadow:0 1px 0 var(--accent)}.download-job{padding-inline:8px!important}.download-job-heading strong{font-size:14px;font-weight:550}.download-job-heading small{font-size:11px!important}.download-job progress{border-radius:3px;overflow:hidden}.download-job .status{font-size:10px;padding:6px 9px;background:oklch(26% .018 240);border-radius:5px}.download-job .status[data-state=loading]{color:var(--accent)}

.download-tabs{display:flex;gap:10px;flex-wrap:wrap;margin:28px 0 22px}.download-tabs .selected{color:var(--accent);background:oklch(26% .03 225)}.download-job{padding:24px 0;border-bottom:1px solid var(--line)}.download-job-heading{display:flex;align-items:center;gap:18px}.download-job-heading>div{flex:1;min-width:0}.download-job-heading strong,.download-job-heading small{display:block}.download-job-heading small{color:var(--muted);margin:9px 0;font-size:12px;line-height:1.6}.download-job progress{width:100%;height:6px;accent-color:var(--accent);margin:10px 0;border:0}.inline-error{color:oklch(80% .11 30)}@media(max-width:760px){.result-row{flex-wrap:wrap}.result-row>.muted{font-size:11px}.download-tabs{gap:7px}.download-tabs button{padding-inline:15px}.download-job-heading{gap:8px}}
</style>

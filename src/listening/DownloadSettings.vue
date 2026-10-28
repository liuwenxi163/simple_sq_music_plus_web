<script setup>
import { computed, onMounted, ref } from 'vue'
import configInfoStore from '../stores/config'
import { api } from './api'

const config = configInfoStore()
const key = 'system.download.file.audio.format'
const selected = computed(() => config.getDownloadFormat || 'auto')
const saving = ref(false), loading = ref(true), error = ref(''), saved = ref(false)
const options = computed(() => {
  try { return JSON.parse(config.data.find(item => item.configKey === key)?.configOptions || '[]') } catch { return [] }
})
async function refresh() { config.setData(await api('/config/getConfigList')) }
onMounted(async () => { try { await refresh() } catch (e) { error.value = e.message } finally { loading.value = false } })
async function save(event) {
  const value = event.target.value
  saving.value = true; saved.value = false; error.value = ''
  try {
    await api('/config/updateConfig', { configKey: key, configValue: value })
    await refresh(); saved.value = true
  } catch (e) { error.value = e.message }
  finally { saving.value = false; event.target.value = selected.value }
}
</script>

<template>
  <section class="download-settings" aria-label="下载音质设置">
    <div><h2>下载音质</h2><p id="download-quality-help" class="muted">默认下载最高可用音质，优先无损。实际音质取决于歌曲提供的版本及账号权限；仅影响新任务，在线播放音质单独设置。</p></div>
    <div class="quality-control"><label for="download-quality">新任务音质</label><select id="download-quality" :value="selected" :disabled="loading || saving" aria-describedby="download-quality-help" @change="save"><option value="auto">最高可用音质（默认）</option><option v-for="option in options.filter(item => item.value !== 'auto')" :key="option.value" :value="option.value">{{ option.label }}</option></select><span class="muted" role="status">{{ loading ? '正在读取设置…' : saving ? '正在保存…' : saved ? '已保存，后续下载使用此设置' : '保存到服务器，手机与电脑共用' }}</span></div>
    <p v-if="error" class="quality-error" role="alert">{{ error }} <button class="text-button" @click="refresh().then(() => error = '').catch(e => error = e.message)">重新读取</button></p>
  </section>
</template>

<style scoped>
.download-settings{display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,300px);gap:20px 40px;padding:24px 0 30px;border-bottom:1px solid var(--line)}
.download-settings h2{margin-bottom:12px}.download-settings p{max-width:65ch}.quality-control{display:grid;gap:9px;align-content:start}.quality-control label{font-size:13px}.quality-control .muted{font-size:12px}.quality-error{grid-column:1/-1;color:oklch(80% .11 30)}
@media(max-width:760px){.download-settings{grid-template-columns:minmax(0,1fr);gap:22px;padding-top:0}.quality-control{max-width:100%}.quality-control select{width:100%}}
</style>

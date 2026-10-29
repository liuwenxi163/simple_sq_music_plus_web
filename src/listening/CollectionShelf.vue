<script setup>
import { onMounted, ref } from 'vue'
import { api } from './api'
import Artwork from './Artwork.vue'
import Icon from './Icon.vue'
import PlaylistSource from './PlaylistSource.vue'
import { playlistKindLabel } from './playlist-source'
const emit=defineEmits(['open'])
const lists=ref([]),failed=ref(false)
onMounted(async()=>{try{const data=await api('/listening/collection');lists.value=(data.playlists||[]).filter(p=>p.tracks?.length).slice(0,6)}catch{failed.value=true}})
</script>
<template><section v-if="lists.length" class="collection-shelf"><div class="section-heading"><div><span class="eyebrow">FROM YOUR COLLECTION</span><h2>你的歌单，随时回来听</h2></div><button class="text-button" @click="emit('open','')">全部歌单<Icon name="arrow" :size="17" /></button></div><div class="shelf-grid"><button v-for="list in lists" :key="list.id" class="shelf-playlist" @click="emit('open',list.id)"><Artwork :src="list.coverUrl || list.tracks?.[0]?.pic" /><span><strong>{{list.name}}</strong><span class="shelf-playlist-meta"><PlaylistSource :playlist="list" /><small>{{list.tracks.length}} 首 · {{playlistKindLabel(list.kind)}}</small></span></span><Icon name="arrow" :size="16" /></button></div></section><p v-else-if="failed" class="shelf-unavailable">账号歌单暂时未能读取，可在「我的歌单」重试同步。</p></template>
<style scoped>
.shelf-playlist-meta{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:8px}.shelf-playlist .shelf-playlist-meta small{margin-top:0}.shelf-playlist-meta .playlist-source{flex-shrink:0}
</style>

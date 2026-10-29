<script setup>
import { computed } from 'vue'
import { playlistSource } from './playlist-source'
const props = defineProps({ playlist: { type: Object, required: true } })
const source = computed(() => playlistSource(props.playlist))
</script>

<template>
  <span class="playlist-source" :class="'source-' + source.id"><i aria-hidden="true">{{ source.mark }}</i><span>{{ source.label }}</span></span>
</template>

<style scoped>
.playlist-source{display:inline-flex;align-items:center;gap:6px;max-width:100%;width:fit-content;padding:4px 7px;border:1px solid oklch(61% .025 245 / .22);border-radius:6px;background:oklch(26% .018 245 / .65);color:oklch(83% .025 245);font-size:10px;font-weight:500;line-height:1.4;letter-spacing:0;white-space:nowrap;vertical-align:middle}
.playlist-source i{display:grid;place-items:center;flex-shrink:0;width:15px;height:15px;border-radius:50%;font-size:9px;font-style:normal;font-weight:650;background:oklch(65% .04 225 / .16);color:oklch(83% .06 215)}
.source-qqvip i{background:oklch(69% .1 165 / .16);color:oklch(82% .09 165)}
.source-netease i{background:oklch(69% .08 25 / .17);color:oklch(83% .08 25)}
.source-unknown{color:var(--muted)}
@media(max-width:760px){.playlist-source{font-size:10px}}
</style>

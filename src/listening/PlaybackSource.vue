<script setup>
import Icon from './Icon.vue'
defineProps({ origin: Object, compact: Boolean })
</script>
<template><span v-if="origin" class="playback-source" :class="{'source-compact':compact}" :data-origin="origin.kind" :title="origin.detail" :aria-label="origin.label+'：'+origin.detail"><Icon :name="origin.icon" :size="compact?12:14" /><span>{{origin.label}}</span><span v-if="!compact && origin.kind==='online'" class="source-note">未保存到 NAS</span></span></template>
<style scoped>
.playback-source{display:inline-flex;align-items:center;gap:7px;color:oklch(80% .06 200);font-size:11px;line-height:1.5;white-space:nowrap}.playback-source[data-origin=nas]{color:oklch(82% .06 155)}.playback-source[data-origin=pending]{color:var(--muted)}.source-note{color:oklch(78% .016 250 / .58);font-size:10px}.source-compact{font-size:10px;gap:5px}@media(max-width:450px){.source-note{display:none}}
</style>

<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
const props=defineProps({options:{type:Array,default:()=>[]},label:{type:String,default:'加入歌单'},compact:Boolean})
const emit=defineEmits(['select'])
const groups=computed(()=>[...new Set(props.options.map(o=>o.destination))])
function choose(event){const target=props.options.find(option=>option.id===event.target.value);event.target.value='';if(target)emit('select',target)}
</script>
<template><label class="playlist-target" :class="{'target-compact':compact}"><Icon name="plus" :size="18" /><span v-if="!compact">加入歌单</span><select value="" :aria-label="label" :disabled="!options.length" @change="choose"><option value="" disabled>选择保存位置</option><optgroup v-for="group in groups" :key="group" :label="group"><option v-for="option in options.filter(o=>o.destination===group)" :key="option.id" :value="option.id">{{option.name}}</option></optgroup></select></label></template>
<style scoped>.playlist-target{display:inline-flex;align-items:center;gap:8px;position:relative;min-height:44px;color:var(--muted);font-size:12px;white-space:nowrap;cursor:pointer}.playlist-target:hover{color:var(--text)}.playlist-target select{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}.playlist-target:focus-within{outline:2px solid var(--accent);outline-offset:3px;border-radius:5px}.target-compact{width:40px;justify-content:center;flex-shrink:0}</style>

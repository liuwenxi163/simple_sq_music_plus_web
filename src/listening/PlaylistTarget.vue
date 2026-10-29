<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import Icon from './Icon.vue'
const props=defineProps({options:{type:Array,default:()=>[]},label:{type:String,default:'加入歌单'},compact:Boolean})
const emit=defineEmits(['select'])
const groups=computed(()=>[...new Set(props.options.map(o=>o.destination))])
const opened=ref(false),anchor=ref(null),menu=ref(null),position=ref({})
function close(focus=false){opened.value=false;if(focus)anchor.value?.focus()}
async function toggle(){
  if(opened.value){close();return}
  const r=anchor.value.getBoundingClientRect(),width=Math.min(290,innerWidth-32),below=innerHeight-r.bottom-16
  position.value={left:Math.max(16,Math.min(innerWidth-width-16,r.right-width))+'px',width:width+'px',...(below>=220?{top:r.bottom+8+'px',maxHeight:Math.min(430,below)+'px'}:{bottom:innerHeight-r.top+8+'px',maxHeight:Math.min(430,r.top-24)+'px'})}
  opened.value=true;await nextTick();menu.value?.querySelector('button')?.focus()
}
function choose(target){close(true);emit('select',target)}
function outside(event){if(opened.value&&!anchor.value?.contains(event.target)&&!menu.value?.contains(event.target))close()}
function key(event){
  event.stopPropagation()
  if(event.key==='Escape'){event.preventDefault();close(true);return}
  if(event.key==='Tab'){close(true);return}
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return
  event.preventDefault();const items=[...menu.value.querySelectorAll('button')],i=items.indexOf(document.activeElement)
  const next=event.key==='Home'?0:event.key==='End'?items.length-1:(i+(event.key==='ArrowDown'?1:-1)+items.length)%items.length
  items[next]?.focus()
}
function moved(event){if(opened.value&&(event.type==='resize'||!menu.value?.contains(event.target)))close()}
onMounted(()=>{document.addEventListener('pointerdown',outside);window.addEventListener('resize',moved);document.addEventListener('scroll',moved,true)})
onUnmounted(()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',moved);document.removeEventListener('scroll',moved,true)})
</script>
<template>
  <button ref="anchor" class="playlist-target" :class="{'target-compact':compact}" :aria-label="label" aria-haspopup="menu" :aria-expanded="opened" :disabled="!options.length" @click="toggle"><Icon name="plus" :size="18" /><span v-if="!compact">加入歌单</span></button>
  <Teleport to="body"><div v-if="opened" ref="menu" class="playlist-destination-menu" role="menu" :aria-label="label" :style="position" @keydown="key"><header>保存到歌单<span>选择一个位置</span></header><section v-for="group in groups" :key="group"><p>{{group}}</p><button v-for="option in options.filter(o=>o.destination===group)" :key="option.id" role="menuitem" @click="choose(option)"><Icon name="queue" :size="17" /><span>{{option.name}}</span><Icon name="plus" :size="15" /></button></section></div></Teleport>
</template>
<style>
.playlist-target{display:inline-flex;align-items:center;gap:8px;position:relative;min-height:44px;padding:0;color:var(--muted);font-size:12px;white-space:nowrap;cursor:pointer;background:none;border:0}.playlist-target:hover,.playlist-target[aria-expanded=true]{color:var(--text)}.playlist-target:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:5px}.playlist-target.target-compact{width:40px;justify-content:center;flex-shrink:0}.playlist-destination-menu{position:fixed;z-index:1500;overflow-y:auto;overscroll-behavior:contain;padding:8px;background:oklch(25% .01 260);color:var(--text);border:1px solid oklch(65% .012 260 / .28);border-radius:13px;box-shadow:0 18px 70px oklch(5% .01 260 / .6);font-family:inherit;text-align:left}.playlist-destination-menu header{display:flex;justify-content:space-between;align-items:center;padding:12px 10px 16px;font-size:13px;font-weight:550}.playlist-destination-menu header span{font-size:10px;font-weight:400;color:var(--muted)}.playlist-destination-menu section+section{border-top:1px solid var(--line);margin-top:6px;padding-top:6px}.playlist-destination-menu section>p{padding:9px 10px 7px;color:var(--muted);font-size:10px;letter-spacing:.5px}.playlist-destination-menu section>button{display:flex;width:100%;align-items:center;gap:12px;padding:12px 10px;min-height:45px;border:0;border-radius:7px;background:none;color:var(--text);text-align:left;cursor:pointer;font-family:inherit;font-size:13px}.playlist-destination-menu section>button>span{flex:1}.playlist-destination-menu section>button>svg{color:var(--muted);flex-shrink:0}.playlist-destination-menu section>button:hover,.playlist-destination-menu section>button:focus-visible{background:oklch(40% .015 260);outline:none}.playlist-destination-menu section>button:focus-visible{box-shadow:inset 0 0 0 1px var(--accent)}
</style>

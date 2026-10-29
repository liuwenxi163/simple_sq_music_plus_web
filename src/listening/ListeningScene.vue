<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { createScene, defaultPalette, paletteFromPixels } from './scene-shader'
import { createAudioAnalysis } from './audio-analysis'
import { visualModes } from './playback-origin'
const props=defineProps({audio:Object,cover:String,playing:Boolean,mode:{type:String,default:'aurora'}})
const emit=defineEmits(['signal'])
const canvas=ref(null),renderer=ref('css'),signal=ref('ambient'),frames=ref(0),fps=ref(0)
let scene,analysis,observer,frame=0,last=0,time=0,count=0,palette=defaultPalette.map(c=>[...c]),generation=0,disposed=false,reduce,budget=600000,windowStart=0,windowFrames=0,fastWindows=0,band=[.17,.04]
const zero=new Float32Array(64)
function resize(){
  if(!canvas.value)return
  const {width,height}=canvas.value.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,1.35,Math.sqrt(budget/Math.max(1,width*height)))
  const stage=canvas.value.closest('.player-stage'),dock=stage?.querySelector('.stage-dock')?.getBoundingClientRect(),song=stage?.querySelector('.stage-song')?.getBoundingClientRect();if(dock){const gap=song?.height?Math.max(0,dock.top-song.bottom-20):40;band=[1-(dock.top-8)/height,Math.min(38,gap)/height]}
  canvas.value.width=Math.max(1,Math.round(width*scale));canvas.value.height=Math.max(1,Math.round(height*scale));draw()
}
function draw(){
  if(!scene)return
  const sample=props.mode!=='still'&&!reduce?.matches&&props.playing?analysis?.sample()||{levels:zero,energy:0,live:false}:{levels:zero,energy:0,live:false}
  const next=sample.live&&props.playing?'live':props.playing?'ambient':'paused'
  if(signal.value!==next){signal.value=next;emit('signal',next)}
  scene.draw(time,sample.energy,sample.levels,palette,props.mode==='spectrum'&&sample.live?1:0,band,visualModes.find(mode=>mode.id===props.mode)?.style||0)
}
function tick(now){
  frame=0;if(disposed||document.hidden||!props.playing||props.mode==='still'||reduce?.matches)return
  time+=last?Math.min((now-last)/1000,.1):0;last=now;draw();count++
  windowFrames++;if(!windowStart)windowStart=now;
  if(now-windowStart>650&&windowFrames>=3){fps.value=Math.round(windowFrames*1000/(now-windowStart));frames.value=count;if(fps.value<38&&budget>75000){budget=Math.max(75000,Math.round(budget*.4));resize();fastWindows=0}else if(fps.value>54&&budget<600000){fastWindows++;if(fastWindows>8){budget=Math.min(600000,Math.round(budget*1.25));resize();fastWindows=0}}windowStart=now;windowFrames=0}
  frame=requestAnimationFrame(tick)
}
function refresh(){
  cancelAnimationFrame(frame);frame=0;last=0;windowStart=0;windowFrames=0
  if(!scene||props.mode==='still'||reduce?.matches||document.hidden){analysis?.suspend();signal.value=props.playing?'ambient':'paused';emit('signal',signal.value);draw();return}
  if(props.playing){analysis?.activate();frame=requestAnimationFrame(tick)}else{analysis?.suspend();draw()}
}
async function activate(){await analysis?.activate();refresh()}
function initialize(){scene?.dispose();try{scene=createScene(canvas.value)}catch{scene=null};renderer.value=scene?'webgl':'css';resize();refresh()}
function lost(event){event.preventDefault();cancelAnimationFrame(frame);analysis?.suspend();scene=null;renderer.value='css';signal.value=props.playing?'ambient':'paused';emit('signal',signal.value)}
function colors(url){
  const request=++generation;if(!url){palette=defaultPalette.map(c=>[...c]);draw();return}
  const image=new Image();image.crossOrigin='anonymous';image.referrerPolicy='no-referrer'
  image.onload=()=>{if(disposed||request!==generation)return;try{const sample=document.createElement('canvas');sample.width=sample.height=24;const c=sample.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0,24,24);palette=paletteFromPixels(c.getImageData(0,0,24,24).data);draw()}catch{palette=defaultPalette.map(c=>[...c]);draw()}}
  image.onerror=()=>{if(request===generation){palette=defaultPalette.map(c=>[...c]);draw()}};image.src=url
}
watch(()=>props.cover,colors)
watch(()=>[props.playing,props.mode],refresh)
onMounted(()=>{
  reduce=matchMedia('(prefers-reduced-motion: reduce)');reduce.addEventListener('change',refresh)
  analysis=createAudioAnalysis(props.audio);initialize();colors(props.cover)
  observer=new ResizeObserver(resize);observer.observe(canvas.value)
  canvas.value.addEventListener('webglcontextlost',lost);canvas.value.addEventListener('webglcontextrestored',initialize)
  document.addEventListener('visibilitychange',refresh)
})
onUnmounted(()=>{disposed=true;generation++;cancelAnimationFrame(frame);observer?.disconnect();scene?.dispose();analysis?.dispose();reduce?.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh)})
defineExpose({activate,layout:resize})
</script>
<template><div class="listening-scene" aria-hidden="true"><div class="scene-poster" :style="cover?{backgroundImage:`url(${JSON.stringify(cover)})`}:{}"></div><canvas ref="canvas" :data-renderer="renderer" :data-audio-signal="signal" :data-rendered-frames="frames" :data-render-fps="fps" :class="{'scene-hidden':renderer!=='webgl'||mode==='still'}"></canvas><div class="scene-shade"></div></div></template>
<style scoped>
.listening-scene{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:oklch(12% .016 250)}.scene-poster{position:absolute;inset:-20%;background-position:center;background-size:cover;filter:blur(90px) saturate(1.4);opacity:.22;transform:scale(1.08)}canvas{position:absolute;width:100%;height:100%;inset:0;opacity:1;transition:opacity .3s}.scene-hidden{opacity:0}.scene-shade{position:absolute;inset:0;background:linear-gradient(180deg,oklch(8% .015 250 / .15),transparent 30%,oklch(8% .015 250 / .12) 65%,oklch(8% .015 250 / .74))}
</style>

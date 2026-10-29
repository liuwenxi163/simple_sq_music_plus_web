<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { createScene } from './scene-renderer'
import { defaultPalette, paletteFromPixels } from './scene-palette'
import { createAudioAnalysis } from './audio-analysis'
import { createAudioFeatures } from './audio-features'
const props=defineProps({audio:Object,cover:String,playing:Boolean,mode:{type:String,default:'aurora'}})
const emit=defineEmits(['signal'])
const canvas=ref(null),renderer=ref('css'),signal=ref('waiting'),frames=ref(0),fps=ref(0),drawMs=ref(0),bassLevel=ref(0),midLevel=ref(0),highLevel=ref(0)
const silence=createAudioFeatures()
let scene,analysis,observer,frame=0,last=0,count=0,palette=defaultPalette.map(c=>[...c]),generation=0,disposed=false,reduce,budget=1500000,windowStart=0,windowFrames=0,drawTotal=0,layout={}
function status(value){if(signal.value!==value){signal.value=value;emit('signal',value)}}
function draw(){
  if(!scene){status('unavailable');return}
  const enabled=props.mode!=='still'&&!reduce?.matches&&props.playing&&!document.hidden
  const sample=enabled?analysis?.sample()||{...silence.reset(),live:false,reason:'waiting'}:{...silence.reset(),live:false}
  status(props.mode==='still'?'still':reduce?.matches?'reduced':!props.playing?'paused':sample.live?'live':sample.reason||'waiting')
  scene.draw(sample,palette,props.mode,layout)
  if(!sample.live)bassLevel.value=midLevel.value=highLevel.value=0
  if(canvas.value)canvas.value.closest('.player-stage')?.style.setProperty('--sound-energy',String(sample.energy))
  return sample
}
function resize(){
  if(!canvas.value)return
  const bounds=canvas.value.getBoundingClientRect(),{width,height}=bounds
  const scale=Math.min(devicePixelRatio||1,1.4,Math.sqrt(budget/Math.max(1,width*height)))
  const stage=canvas.value.closest('.player-stage'),cover=stage?.querySelector('.stage-cover')?.getBoundingClientRect(),rail=stage?.querySelector('.stage-spectrum-slot')?.getBoundingClientRect()
  layout={width,height,cover:cover?.width?{x:cover.left-bounds.left,y:cover.top-bounds.top,width:cover.width,height:cover.height}:{x:width*.18,y:height*.18,width:width*.27,height:width*.27},rail:rail?{x:rail.left-bounds.left,y:rail.top-bounds.top,width:rail.width,height:rail.height}:{x:width*.1,y:height*.76,width:width*.8,height:40}}
  canvas.value.width=Math.max(1,Math.floor(width*scale));canvas.value.height=Math.max(1,Math.floor(height*scale));draw()
}
function tick(now){
  frame=0;if(disposed||document.hidden||!props.playing||props.mode==='still'||reduce?.matches)return
  if(!last||now-last>=1000/60-1){
    last=now;const began=performance.now(),sample=draw();drawTotal+=performance.now()-began;count++;windowFrames++;if(!windowStart)windowStart=now
    if(now-windowStart>=1000){
      fps.value=Math.round(windowFrames*1000/(now-windowStart));frames.value=count;drawMs.value=Math.round(drawTotal/windowFrames*10)/10;drawTotal=0
      bassLevel.value=Math.round((sample?.bass||0)*100);midLevel.value=Math.round((sample?.mids||0)*100);highLevel.value=Math.round((sample?.highs||0)*100)
      if(drawMs.value>12&&budget>450000){budget=Math.max(450000,Math.round(budget*.75));resize()}
      windowStart=now;windowFrames=0
    }
  }
  frame=requestAnimationFrame(tick)
}
function refresh(){
  cancelAnimationFrame(frame);frame=0;last=0;windowStart=0;windowFrames=0;drawTotal=0
  if(!scene||props.mode==='still'||reduce?.matches||document.hidden||!props.playing){analysis?.suspend();draw();return}
  analysis?.activate();frame=requestAnimationFrame(tick)
}
async function activate(){await analysis?.activate();refresh()}
function colors(url){
  const request=++generation;palette=defaultPalette.map(c=>[...c]);draw();if(!url)return
  const image=new Image();image.crossOrigin='anonymous';image.referrerPolicy='no-referrer'
  image.onload=()=>{if(disposed||request!==generation)return;try{const sample=document.createElement('canvas');sample.width=sample.height=24;const c=sample.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0,24,24);palette=paletteFromPixels(c.getImageData(0,0,24,24).data);draw()}catch{}}
  image.src=url
}
watch(()=>props.cover,colors)
watch(()=>[props.playing,props.mode],refresh)
onMounted(()=>{
  reduce=matchMedia('(prefers-reduced-motion: reduce)');reduce.addEventListener('change',refresh)
  analysis=createAudioAnalysis(props.audio);scene=createScene(canvas.value);renderer.value=scene?'canvas2d':'css'
  resize();refresh();colors(props.cover)
  observer=new ResizeObserver(resize);observer.observe(canvas.value);const stage=canvas.value.closest('.player-stage');for(const el of stage.querySelectorAll('.stage-cover,.stage-spectrum-slot'))observer.observe(el)
  document.addEventListener('visibilitychange',refresh)
})
onUnmounted(()=>{disposed=true;generation++;cancelAnimationFrame(frame);observer?.disconnect();scene?.dispose();analysis?.dispose();reduce?.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh)})
defineExpose({activate,layout:resize})
</script>
<template><div class="listening-scene" aria-hidden="true"><div v-if="renderer==='css'" class="scene-poster" :style="cover?{backgroundImage:`url(${JSON.stringify(cover)})`}:{}"></div><canvas ref="canvas" :data-renderer="renderer" :data-audio-signal="signal" :data-rendered-frames="frames" :data-render-fps="fps" :data-draw-ms="drawMs" :data-bass="bassLevel" :data-mids="midLevel" :data-highs="highLevel"></canvas></div></template>
<style scoped>
.listening-scene{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:oklch(12% .016 250)}.scene-poster{position:absolute;inset:-20%;background-position:center;background-size:cover;filter:blur(90px) saturate(1.2);opacity:.15}canvas{position:absolute;width:100%;height:100%;inset:0}
</style>
